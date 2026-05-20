const { dbPromise } = require('../db/database');

class RoutineService {
  static validateRoutine(routine) {
    const errors = [];
    
    if (!routine.name || routine.name.trim() === '') {
      errors.push('Name is required');
    } else if (routine.name.trim().length < 3) {
      errors.push('Name must be at least 3 characters long');
    } else if (routine.name.length > 100) {
      errors.push('Name must not exceed 100 characters');
    }

    if (!routine.skinType) {
      errors.push('Skin type is required');
    }
    const validSkinTypes = ['oily', 'dry', 'combination', 'sensitive', 'normal'];
    if (routine.skinType && !validSkinTypes.includes(routine.skinType.toLowerCase())) {
      errors.push('Invalid skin type. Must be oily, dry, combination, sensitive, or normal');
    }

    if (routine.difficulty !== undefined && routine.difficulty !== null) {
      const diff = parseInt(routine.difficulty);
      if (isNaN(diff) || diff < 1 || diff > 5) {
        errors.push('Difficulty must be an integer between 1 and 5');
      }
    }

    if (routine.points !== undefined && routine.points !== null) {
      const pts = parseInt(routine.points);
      if (isNaN(pts) || pts < 0) {
        errors.push('Points must be a positive integer');
      }
    }
    
    return errors;
  }

  static async createRoutine(routineData) {
    const errors = this.validateRoutine(routineData);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const { name, skinType, description, steps, category, difficulty, points, userId } = routineData;
    
    const result = await dbPromise.run(
      `INSERT INTO routines (name, skinType, description, steps, category, difficulty, points, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, skinType, description || '', steps || '', category || '', difficulty || 3, points || 0, userId || 1]
    );

    return this.getRoutineById(result.id);
  }

  static async getAllRoutines(filters = {}) {
    let query = `
      SELECT r.*, u.username as creatorName, u.email as creatorEmail 
      FROM routines r 
      LEFT JOIN users u ON r.userId = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.skinType) {
      query += ' AND r.skinType = ?';
      params.push(filters.skinType);
    }
    if (filters.category) {
      query += ' AND r.category = ?';
      params.push(filters.category);
    }
    if (filters.search) {
      query += ' AND (r.name LIKE ? OR r.description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY r.createdAt DESC';
    return await dbPromise.all(query, params);
  }

  static async getRoutineById(id) {
    return await dbPromise.get(`
      SELECT r.*, u.username as creatorName, u.email as creatorEmail 
      FROM routines r 
      LEFT JOIN users u ON r.userId = u.id 
      WHERE r.id = ?
    `, [id]);
  }

  static async updateRoutine(id, updateData) {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      throw new Error('Routine not found');
    }

    const updatedRoutine = { ...routine, ...updateData };
    const errors = this.validateRoutine(updatedRoutine);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const { name, skinType, description, steps, category, difficulty, points, userId } = updatedRoutine;
    
    await dbPromise.run(
      `UPDATE routines 
       SET name = ?, skinType = ?, description = ?, steps = ?, category = ?, difficulty = ?, points = ?, userId = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, skinType, description, steps, category, difficulty, points, userId || 1, id]
    );

    return this.getRoutineById(id);
  }

  static async deleteRoutine(id) {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      throw new Error('Routine not found');
    }

    await dbPromise.run('DELETE FROM routines WHERE id = ?', [id]);
    return { message: 'Routine deleted successfully' };
  }

  static async searchRoutines(searchTerm) {
    return await dbPromise.all(
      `SELECT r.*, u.username as creatorName, u.email as creatorEmail 
       FROM routines r 
       LEFT JOIN users u ON r.userId = u.id
       WHERE r.name LIKE ? OR r.description LIKE ? OR r.steps LIKE ?
       ORDER BY r.createdAt DESC`,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
  }
}

module.exports = RoutineService;