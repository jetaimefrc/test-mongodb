import chai from 'chai'
import chaiHttp = require('chai-http')
import 'mocha'
import app from '../../src/app'
import { UserModel } from '../../src/schemas/User'
import { hashSync } from 'bcrypt'

chai.use(chaiHttp)

const expect = chai.expect

const user = {
  _id: null,
  username: 'xxx',
  firstName: 'yyy',
  lastName: 'zzz',
  email: 'asasdd@email.com',
  password: 'xyz123',
  phone: '5555555',
  userStatus: 1,
}

let token

describe('userRoute', () => {
  before(async () => {
    await expect(UserModel.modelName).to.be.equal('User')
    // await UserModel.collection.drop()
    const newUser = new UserModel(user)
    newUser.password = hashSync(newUser.password, +(process.env.SALT as string))
    await newUser.save().then(createdUser => {
      user._id = createdUser._id
      // done()
    })
  })

  it('should be able to login', () => {
    return chai
      .request(app)
      .get(`/login?username=${user.username}&password=${user.password}`)
      .then(res => {
        // console.log(res)
        expect(res.status).to.be.equal(200)
        token = res.body.token
      })
  })

  it('should respond with HTTP 404 status because there is no user', () => {
    return chai
      .request(app)
      .get(`/users/NO_USER`)
      .set('Authorization', `Bearer ${token}`)
      .then(res => {
        expect(res.status).to.be.equal(404)
      })
  })

  it('should create a new user and retrieve it back', () => {
    const tempUser = {
      username: 'VLXX',
      firstName: 'yyy',
      lastName: 'zzz',
      email: 'unique_emadasdasi323@email.com',
      password: 'xyz123',
      phone: '5555555',
      userStatus: 1,
    }
    const newUser = new UserModel(tempUser)
    newUser.password = hashSync(newUser.password, +(process.env.SALT as string))

    return chai
      .request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send(newUser)
      .then(res => {
        expect(res.status).to.be.equal(201)
        expect(res.body.username).to.be.equal(tempUser.username)
      })
  })

  it('should return the user created on the step before', () => {
    return chai
      .request(app)
      .get(`/users/${user.username}`)
      .set('Authorization', `Bearer ${token}`)
      .then(res => {
        expect(res.status).to.be.equal(200)
        expect(res.body.username).to.be.equal(user.username)
      })
  })

  it('should updated the user 123 - have specific email', () => {
    const temp = {
      username: '456',
      firstName: 'Ahihi',
      lastName: 'xxx',
      email: 'a@gmailxxx.com',
      password: 'password Updated',
      phone: '3333333',
      userStatus: 12,
    }
    temp.password = hashSync(temp.password, +(process.env.SALT as string))
    UserModel.findOne({ email: 'a@gmail.com' }).then(foundUser => {
      UserModel.findByIdAndUpdate(foundUser._id, temp)
    })

    return chai
      .request(app)
      .patch(`/users/456`)
      .set('Authorization', `Bearer ${token}`)
      .send(user)
      .then(res => {
        expect(res.status).to.be.equal(200)
      })
  })

  it('should return the user updated on the step before', () => {
    return chai
      .request(app)
      .get(`/users/${user.username}`)
      .set('Authorization', `Bearer ${token}`)
      .then(res => {
        expect(res.status).to.be.equal(200)
        expect(res.body.username).to.be.equal(user.username)
        expect(res.body.firstName).to.be.equal(user.firstName)
        expect(res.body.lastName).to.be.equal(user.lastName)
        expect(res.body.email).to.be.equal(user.email)
        expect(res.body.password).to.be.equal(user.password)
        expect(res.body.phone).to.be.equal(user.phone)
        expect(res.body.userStatus).to.be.equal(user.userStatus)
      })
  })

  it('should return 404 because the user does not exist', () => {
    user.firstName = 'Mary Jane'

    return chai
      .request(app)
      .patch(`/users/Mary`)
      .set('Authorization', `Bearer ${token}`)
      .send(user)
      .then(res => {
        expect(res.status).to.be.equal(404)
      })
  })

  it('should remove an existent user', () => {
    return chai
      .request(app)
      .del(`/users/${user.username}`)
      .set('Authorization', `Bearer ${token}`)
      .then(res => {
        expect(res.status).to.be.equal(204)
      })
  })

  it('should return 404 when it is trying to remove an user because the user does not exist', () => {
    return chai
      .request(app)
      .del(`/users/Mary`)
      .set('Authorization', `Bearer ${token}`)
      .then(res => {
        expect(res.status).to.be.equal(404)
      })
  })
})
