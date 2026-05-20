const express = require('express');
const router = express.Router();
const RoutineService = require('../services/routineService');

/**
 * @swagger
 * /api/routines:
 *   get:
 *     summary: Get all routines
 *     parameters:
 *       - in: query
 *         name: skinType
 *         schema:
 *           type: string
 *         description: Filter by skin type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of routines
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      skinType: req.query.skinType,
      category: req.query.category,
      search: req.query.search
    };
    const routines = await RoutineService.getAllRoutines(filters);
    res.status(200).json({
      success: true,
      data: routines,
      count: routines.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/routines/search/{term}:
 *   get:
 *     summary: Search routines
 *     parameters:
 *       - in: path
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search/:term', async (req, res) => {
  try {
    const results = await RoutineService.searchRoutines(req.params.term);
    res.status(200).json({ success: true, data: results, count: results.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/routines/{id}:
 *   get:
 *     summary: Get routine by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Routine ID
 *     responses:
 *       200:
 *         description: Routine details
 *       404:
 *         description: Routine not found
 */
router.get('/:id', async (req, res) => {
  try {
    const routine = await RoutineService.getRoutineById(req.params.id);
    if (!routine) {
      return res.status(404).json({ success: false, error: 'Routine not found' });
    }
    res.status(200).json({ success: true, data: routine });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/routines:
 *   post:
 *     summary: Create routine
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               skinType:
 *                 type: string
 *               description:
 *                 type: string
 *               steps:
 *                 type: string
 *               category:
 *                 type: string
 *               difficulty:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Routine created
 *       400:
 *         description: Bad request
 */
router.post('/', async (req, res) => {
  try {
    const routine = await RoutineService.createRoutine(req.body);
    res.status(201).json({ success: true, message: 'Routine created successfully', data: routine });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/routines/{id}:
 *   put:
 *     summary: Update routine
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Routine ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               skinType:
 *                 type: string
 *               description:
 *                 type: string
 *               steps:
 *                 type: string
 *               category:
 *                 type: string
 *               difficulty:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Routine updated
 *       404:
 *         description: Routine not found
 */
router.put('/:id', async (req, res) => {
  try {
    const routine = await RoutineService.updateRoutine(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Routine updated successfully', data: routine });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/routines/{id}:
 *   delete:
 *     summary: Delete routine
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Routine ID
 *     responses:
 *       200:
 *         description: Routine deleted
 *       404:
 *         description: Routine not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await RoutineService.deleteRoutine(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;