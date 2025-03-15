import requests
from bs4 import BeautifulSoup
import sys
import os
from urllib.parse import urljoin
import time
import json
import pandas as pd
from pathlib import Path
import re


# Saves an image from a URL to a local file


def save_image(img_url, img_path):
    print(f"Downloading image: {img_url}")

    if os.path.exists(img_path):
        print(f"Image {img_path} already exists, skipping.")
        return

    # Download the image
    try:
        img_response = requests.get(urljoin(url, img_url))
        img_response.raise_for_status()
        with open(img_path, 'wb') as img_file:
            img_file.write(img_response.content)

        # Sleep to avoid overloading the server
        time.sleep(0.2)
    except requests.RequestException as e:
        print(f"Error downloading image {img_url}: {e}")


def clean_title(title):
    """
    Cleans the project title to make it a valid folder and file name.
    - Converts spaces to underscores.
    - Removes special characters that might break filenames.
    """
    title = title.strip()
    title = title.replace(" ", "_")  # Replace spaces with underscores
    title = re.sub(r'[^\w.-]', '', title)  # Remove all non-alphanumeric characters except _ and .
    return title



def scrape_hackster_project(title, url):
    """
    Scrapes the main content from a Hackster.io project page and saves it as an HTML file.
    """
    try:
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error fetching the page: {e}")
        return

    # Parse the page
    soup = BeautifulSoup(response.text, 'html.parser')

    # Identify the main content area
    main_content = soup.find('div', {'class': 'middle-column'})  # Main project content container
    if not main_content:
        print("Main content container not found.")
        return

    # Use this if you only have the links of the Submissions
    # Extract title for the HTML file
    # title = soup.find('h1')
    # Make title safe for folder name
    # title = title.text.strip().replace(' ', '_').replace('/', '_')

    path = Path(__file__).resolve().parent / "submissions"

    title = clean_title(title)
    submission_path = os.path.join(path, title)
    os.makedirs(submission_path, exist_ok=True)


    print(f"Scraping: {title} - {url}")
    image_id = 0

    # Remove unwanted elements
    for div in main_content.find_all('div', {'class': 'project-authors'}):
        div.decompose()
    for div in main_content.find_all('div', {'class': 'project-details'}):
        div.decompose()
    for div in main_content.find_all('div', {'class': 'actions'}):
        div.decompose()
    for div in main_content.find_all('div', {'class': 'award-mobile'}):
        div.decompose()


    for div in main_content.find_all('a', {'class': 'anchor'}):
        div.decompose()
    for div in main_content.find_all('section', {'id': 'comments'}):
        div.decompose()
    for div in main_content.find_all('section', {'id': 'team'}):
        div.decompose()
    for div in main_content.find_all('a', {'class': 'toggle-container'}):
        div.decompose()
    for div in main_content.find_all('td', {'class': 'actions'}):
        div.decompose()
    for div in main_content.find_all('td', {'class': 'hckui__typography__bodyL times'}):
        div.decompose()
    for div in main_content.find_all('td', {'class': 'hckui__typography__bodyL quantity'}):
        div.decompose()  


    # TODO: Improve tables
    for tables in main_content.find_all('table', {'class': 'project-parts-table'}):

        elem = '''
        <colgroup>
        <col style="width: 100px; height: 50px;">
        <col style="width: auto;">
        </colgroup>
        '''
        
        elem = BeautifulSoup(elem, 'html.parser')
        
        tables.insert(0, elem)

        for head in tables.find_all('tr', {'class': 'head'}):
            first_item = head.find('td', {'colspan': '6'})
            first_item['colspan'] = '2'

        for td in tables.find_all('td'):
            table = td.find('table')
            if table:
                element = table.find('td', {'class': 'hckui__typography__bodyL'})
                if element:
                    # td.string = link['href']
                    td.replace_with(element)

        for td in tables.find_all('td', class_=False):
            if td.text.strip() == '':
                td.decompose()
        #     td.decompose()

   # Process carousel images and collect them in order
    carousel_images_list = []
    for script in main_content.find_all('script', {'data-hypernova-key': 'ImageCarousel'}):
        carousel_content = script.string.replace('<!--', '').replace('-->', '')
        if carousel_content:
            try:
                carousel_json = json.loads(carousel_content)
                images_for_carousel = []
                for image in carousel_json['images']:
                    img_url = image['image_urls']['lightbox_url']
                    img_filename = f"{image_id}.jpg"
                    img_path = os.path.join(submission_path, img_filename)
                    save_image(img_url, img_path)
                    images_for_carousel.append(img_filename)
                    image_id += 1
                carousel_images_list.append(images_for_carousel)
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON: {e}")
        script.decompose()  # Remove script tag

    # Replace carousel containers in order with downloaded images
    carousel_index = 0
    for container_div in main_content.find_all('div', {'data-hypernova-key': 'ImageCarousel'}):
        if carousel_index < len(carousel_images_list):
            new_container = soup.new_tag('div', **{'class': 'carousel-images'})
            for img_filename in carousel_images_list[carousel_index]:
                new_img = soup.new_tag('img', src=img_filename, **{'class': 'carousel-image'})
                new_container.append(new_img)
            container_div.replace_with(new_container)
            carousel_index += 1
        else:
            # If no carousel images were collected for this container, remove it.
            container_div.decompose()

    # Process normal images (skip images already inserted from carousel)
    for img in main_content.find_all('img'):
        if 'carousel-image' in img.get('class', []):
            continue
        img_url = img['src']
        img_filename = f"{image_id}.jpg"
        img_path = os.path.join(submission_path, img_filename)
        save_image(img_url, img_path)
        img['src'] = img_filename
        image_id += 1

    # Replace relative links with absolute links
    for links in main_content.find_all('a'):
        if 'hackster' not in links['href']:
            links['href'] = urljoin("https://www.hackster.io/", links['href'])


    # Replace embeds with actual content
    for embed in main_content.find_all('div', {'class': 'embed'}):
        data_html = embed.get('data-html')
        
        if not data_html:  # Check if data-html is empty or None
            continue  

        # Sanitize the embed content (remove HTML tags, check length, etc.)
        clean_data_html = BeautifulSoup(data_html, 'html.parser').text.strip()

        # Check if it contains known embed types
        if "youtube" in data_html.lower():
            # Handle YouTube embeds
            temp_soup = BeautifulSoup(data_html, 'html.parser')
            for iframe in temp_soup.find_all('iframe'):
                iframe['width'] = '75%'   
                iframe['height'] = '500'
                iframe['style'] = 'margin: 10px auto; display: block;'
            
            new_fragment = temp_soup.find()  # Get first tag
            if embed.parent:
                embed.replace_with(new_fragment)
            else:
                embed.decompose()

        elif "github" in data_html.lower():
            # Handle GitHub embeds
            script = BeautifulSoup(data_html, 'html.parser')
            div = script.find('div', {'class': 'github-widget'})
            if div and 'data-repo' in div.attrs:
                repo = div['data-repo']
                new_html = BeautifulSoup(f'<a href="https://github.com/{repo}">Github</a>', 'html.parser')
                embed.replace_with(new_html)

        else:
            print(f"Skipping unexpected embed: {clean_data_html[:100]}")  # Print warning instead of raising an error
            embed.decompose()  # Remove unexpected embed



    file_name = os.path.join(submission_path, title + ".html")

    # Save to file
    with open(file_name, 'w', encoding='utf-8') as file:
        # Add some styling
        file.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">')
        file.write('<link rel="stylesheet" href="../custom.css">')

        file.write(main_content.prettify())

    print(f'The main content has been successfully saved to {file_name}')


if __name__ == "__main__":
    path = Path(__file__).resolve().parent / "submissions"
    csv_filename = "buildtogether2_submissions.csv"  # Ensure this file is in the same folder as this script

    csv_path = os.path.join(path, csv_filename)
    # Check if the CSV file exists

    if not os.path.exists(csv_path):
        print(f"Error: CSV file '{csv_path}' not found!")
        exit()

    # Read CSV using pandas
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        exit()

    # Check if required columns exist
    if "Title" not in df.columns or "Link" not in df.columns:
        print("Error: CSV file does not contain 'Title' and 'Link' columns!")
        exit()

    # Iterate through rows and process each submission
    for _, row in df.iterrows():
        title = row["Title"]
        url = row["Link"]
        
        if pd.isna(title) or pd.isna(url):  # Skip rows with missing values
            print(f"Skipping invalid row: {row}")
            continue
        
        scrape_hackster_project(title, url)