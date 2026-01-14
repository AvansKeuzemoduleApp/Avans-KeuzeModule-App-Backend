import { LoggerObjectMapped } from '../dto/logger-object.dto';
import { LogFilter, FilterCondition, FilterOperator, FilterValue } from '../dto/log-filter.dto';

/**
 * Evaluates log entries against filter conditions
 * Supports MongoDB-inspired query syntax for flexible log filtering
 */
export class LogFilterEvaluator {
  /**
   * Main evaluation method - determines if a log matches the filter
   * @param log The log object to evaluate
   * @param filter The filter conditions to apply
   * @returns true if the log matches all filter conditions
   */
  evaluate(log: LoggerObjectMapped, filter: LogFilter): boolean {
    // Handle logical operators first
    if (filter.$and) {
      return filter.$and.every(condition => this.evaluateCondition(log, condition));
    }

    if (filter.$or) {
      return filter.$or.some(condition => this.evaluateCondition(log, condition));
    }

    // Handle implicit AND for all top-level conditions
    return this.evaluateCondition(log, filter);
  }

  /**
   * Evaluates a single condition (or multiple conditions with implicit AND)
   * @param log The log object
   * @param condition The condition to evaluate
   * @returns true if all fields in the condition match
   */
  private evaluateCondition(log: any, condition: FilterCondition): boolean {
    return Object.entries(condition).every(([field, matcher]) => {
      // Skip logical operators (they're handled in evaluate())
      if (field === '$and' || field === '$or') {
        return true;
      }

      const value = this.getNestedValue(log, field);
      return this.evaluateField(value, matcher);
    });
  }

  /**
   * Evaluates a single field against its matcher
   * @param value The actual value from the log
   * @param matcher The expected value or operator object
   * @returns true if the value matches the condition
   */
  private evaluateField(value: any, matcher: any): boolean {
    // Direct value comparison (shorthand for $eq)
    if (typeof matcher !== 'object' || matcher === null || Array.isArray(matcher)) {
      return this.evaluateOperator(value, '$eq', matcher);
    }

    // Operator-based comparison
    return Object.entries(matcher).every(([operator, operand]) => {
      return this.evaluateOperator(value, operator as FilterOperator, operand);
    });
  }

  /**
   * Evaluates a specific operator against a value
   * @param value The actual value
   * @param operator The operator to apply
   * @param operand The expected value for the operator
   * @returns true if the operator condition is met
   */
  private evaluateOperator(value: any, operator: string, operand: any): boolean {
    switch (operator) {
      case '$eq':
        return value === operand;

      case '$ne':
        return value !== operand;

      case '$in':
        if (!Array.isArray(operand)) {
          return false;
        }
        return operand.includes(value);

      case '$nin':
        if (!Array.isArray(operand)) {
          return false;
        }
        return !operand.includes(value);

      case '$gt':
        return value > operand;

      case '$gte':
        return value >= operand;

      case '$lt':
        return value < operand;

      case '$lte':
        return value <= operand;

      case '$exists':
        return operand ? value !== undefined && value !== null : value === undefined || value === null;

      case '$regex':
        if (typeof value !== 'string') {
          return false;
        }
        try {
          const regex = new RegExp(operand as string);
          return regex.test(value);
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Retrieves a nested value from an object using dot notation
   * @param obj The object to traverse
   * @param path The path to the value (e.g., 'userData.userId')
   * @returns The value at the path, or undefined if not found
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }
}
