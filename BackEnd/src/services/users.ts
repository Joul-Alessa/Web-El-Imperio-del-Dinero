import { userRepository } from '../repositories/users.js';

export const userService = {
  list() {
    return userRepository.findAll();
  },

  getById(id: number) {
    return userRepository.findById(id);
  },

  create(data: { name: string }) {
    return userRepository.create(data);
  },

  update(id: number, data: { name: string }) {
    return userRepository.update(id, data);
  },

  remove(id: number) {
    return userRepository.remove(id);
  },
};
