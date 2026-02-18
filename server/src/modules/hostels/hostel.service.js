const hostelRepository = require('./hostel.repository');

const getById = (id) => hostelRepository.findById(id);
const getAll = (filter, options) => hostelRepository.findAll(filter, options);
const createHostel = (data) => hostelRepository.create(data);
const updateHostel = (id, data) => hostelRepository.updateById(id, data);
const deleteHostel = (id) => hostelRepository.deleteById(id);

module.exports = { getById, getAll, createHostel, updateHostel, deleteHostel };
