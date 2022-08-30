const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');


const resolvers = {
  // queries the database for information about saved books of the logged in user
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const user = await User.findOne({ _id: context.user._id })
        return user;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },

  Mutation: {
    // create a new account
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);

      return { token, user };
    },
    // login to an existing account
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user with this email found!');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect password!');
      }

      const token = signToken(user);
      return { token, user };
    },
    // save a book to an existing account
    saveBook: async (parent, { saveNewBook }, context) => {
      if (context.user) {
        const savedBook = await User.findByIdAndUpdate(
          context.user._id,
          {
            $push: { savedBooks: saveNewBook },
          },
          {
            new: true,
            runValidators: true,
          }
        );
        return savedBook;
      }

      throw new AuthenticationError('You need to be logged in!');
    },
    // delete a book from the saved books in the account
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const delBook = await User.findOneAndUpdate({ _id: context.user._id }, { $pull: { savedBooks: { bookId } } }, { new: true });
        return delBook;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

module.exports = resolvers;
