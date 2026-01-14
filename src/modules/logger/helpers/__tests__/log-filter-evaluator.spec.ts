import { LogFilterEvaluator } from '../log-filter-evaluator';
import { LoggerObjectMapped } from '../../dto/logger-object.dto';
import { LogFilter } from '../../dto/log-filter.dto';

describe('LogFilterEvaluator', () => {
  let evaluator: LogFilterEvaluator;
  let mockLog: LoggerObjectMapped;

  beforeEach(() => {
    evaluator = new LogFilterEvaluator();
    mockLog = {
      timestamp: new Date('2024-01-14T12:00:00Z'),
      level: 'error',
      codeLocation: 'test.ts:42',
      httpResponse: 404,
      httpMethod: 'GET',
      requestBody: null,
      errorMessage: 'Not found',
      programmerNote: null,
      responseMessage: 'Resource not found',
      originalUrl: '/api/test',
      securityAlert: false,
      message: 'Test message',
      userData: {
        username: 'testuser',
        userId: 'user123',
        requestInterests: null,
        requestMerits: null,
        requestGoals: null,
        requestRoleName: 'admin',
        refreshTokenUsed: null,
      },
      moduleData: {
        moduleId: 42,
        name: 'Test Module',
        requestShortdescription: null,
        requestDescription: null,
        requestStudycredit: null,
        requestLocation: null,
        requestContact_id: null,
        requestLevel: null,
        requestLearningoutcomes: null,
        requestModule_tags: null,
        requestPopularity_score: null,
      },
      debugObject: null,
    };
  });

  describe('$eq operator', () => {
    it('should match equal values', () => {
      const filter: LogFilter = { level: { $eq: 'error' } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should not match different values', () => {
      const filter: LogFilter = { level: { $eq: 'warn' } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(false);
    });

    it('should support shorthand syntax', () => {
      const filter: LogFilter = { level: 'error' };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });
  });

  describe('$ne operator', () => {
    it('should match non-equal values', () => {
      const filter: LogFilter = { level: { $ne: 'warn' } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should not match equal values', () => {
      const filter: LogFilter = { level: { $ne: 'error' } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(false);
    });
  });

  describe('$in operator', () => {
    it('should match values in array', () => {
      const filter: LogFilter = { level: { $in: ['error', 'warn', 'fatal'] } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should not match values not in array', () => {
      const filter: LogFilter = { level: { $in: ['log', 'debug'] } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(false);
    });
  });

  describe('$nin operator', () => {
    it('should match values not in array', () => {
      const filter: LogFilter = { level: { $nin: ['log', 'debug'] } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should not match values in array', () => {
      const filter: LogFilter = { level: { $nin: ['error', 'warn'] } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(false);
    });
  });

  describe('Comparison operators', () => {
    it('should handle $gt operator', () => {
      expect(evaluator.evaluate(mockLog, { httpResponse: { $gt: 400 } })).toBe(true);
      expect(evaluator.evaluate(mockLog, { httpResponse: { $gt: 404 } })).toBe(false);
    });

    it('should handle $gte operator', () => {
      expect(evaluator.evaluate(mockLog, { httpResponse: { $gte: 404 } })).toBe(true);
      expect(evaluator.evaluate(mockLog, { httpResponse: { $gte: 500 } })).toBe(false);
    });

    it('should handle $lt operator', () => {
      expect(evaluator.evaluate(mockLog, { httpResponse: { $lt: 500 } })).toBe(true);
      expect(evaluator.evaluate(mockLog, { httpResponse: { $lt: 404 } })).toBe(false);
    });

    it('should handle $lte operator', () => {
      expect(evaluator.evaluate(mockLog, { httpResponse: { $lte: 404 } })).toBe(true);
      expect(evaluator.evaluate(mockLog, { httpResponse: { $lte: 400 } })).toBe(false);
    });
  });

  describe('$exists operator', () => {
    it('should match existing fields', () => {
      const filter: LogFilter = { userData: { $exists: true } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should match non-existing fields', () => {
      const filter: LogFilter = { debugObject: { $exists: false } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should not match when field existence differs', () => {
      const filter: LogFilter = { userData: { $exists: false } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(false);
    });
  });

  describe('$regex operator', () => {
    it('should match regex patterns', () => {
      const filter: LogFilter = { 'userData.username': { $regex: '^test' } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should not match non-matching patterns', () => {
      const filter: LogFilter = { 'userData.username': { $regex: '^admin' } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(false);
    });

    it('should handle invalid regex gracefully', () => {
      const filter: LogFilter = { 'userData.username': { $regex: '[invalid' } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(false);
    });
  });

  describe('Nested field access', () => {
    it('should access nested fields with dot notation', () => {
      const filter: LogFilter = { 'userData.userId': 'user123' };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should handle deep nesting', () => {
      const filter: LogFilter = { 'moduleData.moduleId': 42 };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should return undefined for non-existent paths', () => {
      const filter: LogFilter = { 'userData.nonexistent': { $exists: false } };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });
  });

  describe('Multiple conditions (implicit AND)', () => {
    it('should match all conditions', () => {
      const filter: LogFilter = {
        level: 'error',
        'userData.userId': 'user123',
        httpResponse: { $gte: 400 },
      };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should fail if any condition does not match', () => {
      const filter: LogFilter = {
        level: 'error',
        'userData.userId': 'wrong-user',
      };
      expect(evaluator.evaluate(mockLog, filter)).toBe(false);
    });
  });

  describe('$and logical operator', () => {
    it('should match when all conditions are true', () => {
      const filter: LogFilter = {
        $and: [
          { level: 'error' },
          { httpResponse: { $gte: 400 } },
        ],
      };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should not match when any condition is false', () => {
      const filter: LogFilter = {
        $and: [
          { level: 'error' },
          { httpResponse: { $lt: 400 } },
        ],
      };
      expect(evaluator.evaluate(mockLog, filter)).toBe(false);
    });
  });

  describe('$or logical operator', () => {
    it('should match when at least one condition is true', () => {
      const filter: LogFilter = {
        $or: [
          { level: 'warn' },
          { httpResponse: { $gte: 400 } },
        ],
      };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should not match when all conditions are false', () => {
      const filter: LogFilter = {
        $or: [
          { level: 'warn' },
          { httpResponse: { $lt: 400 } },
        ],
      };
      expect(evaluator.evaluate(mockLog, filter)).toBe(false);
    });
  });

  describe('Complex nested queries', () => {
    it('should handle complex OR with nested conditions', () => {
      const filter: LogFilter = {
        $or: [
          {
            level: 'error',
            'userData.userId': 'user123',
          },
          {
            securityAlert: true,
          },
        ],
      };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });

    it('should handle complex AND with OR conditions', () => {
      const filter: LogFilter = {
        $and: [
          { level: { $in: ['warn', 'error'] } },
          {
            $or: [
              { httpResponse: { $gte: 400 } },
              { securityAlert: true },
            ],
          },
        ],
      };
      expect(evaluator.evaluate(mockLog, filter)).toBe(true);
    });
  });
});
