const express = require('express');
const { getDashboardStats, getReports, resolveReport, getUsers, updateUserRole, deleteUser } = require('../controllers/adminController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', verifyToken, verifyRole(['admin', 'moderator', 'analyst']), getDashboardStats);
router.get('/reports', verifyToken, verifyRole(['admin', 'moderator']), getReports);
router.post('/reports/:id/resolve', verifyToken, verifyRole(['admin', 'moderator']), resolveReport);
router.get('/users', verifyToken, verifyRole(['admin']), getUsers);
router.put('/users/:id/role', verifyToken, verifyRole(['admin']), updateUserRole);
router.delete('/users/:id', verifyToken, verifyRole(['admin']), deleteUser);

module.exports = router;
