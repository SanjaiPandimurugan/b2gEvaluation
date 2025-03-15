/**
 * User model
 */
class User {
  constructor(data = {}) {
    this.id = null;
    this.name = null;
    this.username = null;
    this.token = null;
    this.status = null;
    this.firstname = null;
    this.lastname = null;
    this.birthdate = null;
    this.gender = null;
    this.educationField = null;
    this.educationLevel = null;
    this.hardwareExperience = null;
    Object.assign(this, data);
  }
}

export default User;
