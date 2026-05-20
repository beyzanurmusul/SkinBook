const RoutineService = require('./routineService');
const { dbPromise } = require('../db/database');

jest.mock('../db/database', () => ({
  dbPromise: {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn()
  }
}));

describe('RoutineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Tests', () => {
    test('should reject empty name', () => {
      const errors = RoutineService.validateRoutine({ skinType: 'oily' });
      expect(errors).toContain('Name is required');
    });

    test('should reject too short name', () => {
      const errors = RoutineService.validateRoutine({ name: 'Te', skinType: 'oily' });
      expect(errors).toContain('Name must be at least 3 characters long');
    });

    test('should reject invalid skin type', () => {
      const errors = RoutineService.validateRoutine({ name: 'Test Routine', skinType: 'invalid_type' });
      expect(errors).toContain('Invalid skin type. Must be oily, dry, combination, sensitive, or normal');
    });

    test('should reject difficulty out of range (1-5)', () => {
      const errors = RoutineService.validateRoutine({ name: 'Test Routine', skinType: 'oily', difficulty: 6 });
      expect(errors).toContain('Difficulty must be an integer between 1 and 5');
    });

    test('should reject negative points', () => {
      const errors = RoutineService.validateRoutine({ name: 'Test Routine', skinType: 'oily', points: -10 });
      expect(errors).toContain('Points must be a positive integer');
    });

    test('should accept valid routine', () => {
      const errors = RoutineService.validateRoutine({ 
        name: 'Test Routine', 
        skinType: 'oily',
        difficulty: 3,
        points: 50
      });
      expect(errors.length).toBe(0);
    });
  });

  describe('Database Operation Tests (CRUD)', () => {
    test('createRoutine should insert data and return the created routine', async () => {
      const mockRoutine = { name: 'Morning Routine', skinType: 'dry', description: 'Cleanse and hydrate' };
      dbPromise.run.mockResolvedValue({ id: 42 });
      dbPromise.get.mockResolvedValue({ id: 42, ...mockRoutine, userId: 1 });

      const result = await RoutineService.createRoutine(mockRoutine);
      expect(dbPromise.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO routines'),
        expect.arrayContaining(['Morning Routine', 'dry', 'Cleanse and hydrate'])
      );
      expect(result).toHaveProperty('id', 42);
      expect(result.name).toBe('Morning Routine');
    });

    test('getAllRoutines should fetch with skinType filters', async () => {
      const mockRoutines = [{ id: 1, name: 'R1', skinType: 'oily' }];
      dbPromise.all.mockResolvedValue(mockRoutines);

      const result = await RoutineService.getAllRoutines({ skinType: 'oily' });
      expect(dbPromise.all).toHaveBeenCalledWith(
        expect.stringContaining('AND r.skinType = ?'),
        ['oily']
      );
      expect(result).toEqual(mockRoutines);
    });

    test('getRoutineById should return routine from database', async () => {
      const mockRoutine = { id: 5, name: 'Hydrating Routine', skinType: 'sensitive' };
      dbPromise.get.mockResolvedValue(mockRoutine);

      const result = await RoutineService.getRoutineById(5);
      expect(dbPromise.get).toHaveBeenCalledWith(
        expect.stringContaining('WHERE r.id = ?'),
        [5]
      );
      expect(result).toEqual(mockRoutine);
    });

    test('updateRoutine should run update statement and return updated routine', async () => {
      const existingRoutine = { id: 2, name: 'Old Name', skinType: 'normal' };
      const updatedData = { name: 'New Name' };
      
      dbPromise.get.mockResolvedValueOnce(existingRoutine); // For fetch existing
      dbPromise.run.mockResolvedValue({ changes: 1 }); // For update
      dbPromise.get.mockResolvedValueOnce({ id: 2, name: 'New Name', skinType: 'normal', userId: 1 }); // For final fetch

      const result = await RoutineService.updateRoutine(2, updatedData);
      expect(dbPromise.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE routines'),
        expect.arrayContaining(['New Name', 'normal'])
      );
      expect(result.name).toBe('New Name');
    });

    test('deleteRoutine should remove entry from database', async () => {
      dbPromise.get.mockResolvedValue({ id: 3, name: 'To Delete' });
      dbPromise.run.mockResolvedValue({ changes: 1 });

      const result = await RoutineService.deleteRoutine(3);
      expect(dbPromise.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM routines WHERE id = ?'),
        [3]
      );
      expect(result).toEqual({ message: 'Routine deleted successfully' });
    });
  });
});