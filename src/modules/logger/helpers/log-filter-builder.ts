import { LogFilter, FilterCondition } from '../dto/log-filter.dto';

/**
 * Optional helper class for building log filters programmatically
 * Provides a fluent API for constructing complex filter queries
 * 
 * @example
 * ```ts
 * const filter = new LogFilterBuilder()
 *   .where('level', '$eq', 'error')
 *   .where('userData.userId', '$eq', 'user123')
 *   .build();
 * ```
 */
export class LogFilterBuilder {
  private conditions: FilterCondition = {};
  private andConditions: FilterCondition[] = [];
  private orConditions: FilterCondition[] = [];
  private useLogicalOperator: 'and' | 'or' | null = null;

  /**
   * Add a simple condition to the filter
   * @param field The field to filter on (supports dot notation)
   * @param operator The operator to use (e.g., '$eq', '$in', '$gt')
   * @param value The value to compare against
   */
  where(field: string, operator: string, value: any): this {
    if (operator === '$eq') {
      // Use shorthand syntax for equality
      this.conditions[field] = value;
    } else {
      this.conditions[field] = { [operator]: value };
    }
    return this;
  }

  /**
   * Add a condition using shorthand equality syntax
   * @param field The field to filter on
   * @param value The value to match
   */
  equals(field: string, value: any): this {
    this.conditions[field] = value;
    return this;
  }

  /**
   * Add an AND condition
   * @param condition The condition to add to the AND array
   */
  and(condition: FilterCondition): this {
    this.useLogicalOperator = 'and';
    this.andConditions.push(condition);
    return this;
  }

  /**
   * Add an OR condition
   * @param condition The condition to add to the OR array
   */
  or(condition: FilterCondition): this {
    this.useLogicalOperator = 'or';
    this.orConditions.push(condition);
    return this;
  }

  /**
   * Build the final filter object
   */
  build(): LogFilter {
    if (this.useLogicalOperator === 'and' && this.andConditions.length > 0) {
      // If we have implicit conditions, add them to the AND array
      if (Object.keys(this.conditions).length > 0) {
        this.andConditions.unshift(this.conditions);
      }
      return { $and: this.andConditions };
    }

    if (this.useLogicalOperator === 'or' && this.orConditions.length > 0) {
      return { $or: this.orConditions };
    }

    return this.conditions;
  }

  /**
   * Reset the builder to start fresh
   */
  reset(): this {
    this.conditions = {};
    this.andConditions = [];
    this.orConditions = [];
    this.useLogicalOperator = null;
    return this;
  }
}

/**
 * Convenience functions for common filter patterns
 */
export class LogFilterPresets {
  /**
   * Filter for error logs only
   */
  static errors(): LogFilter {
    return { level: 'error' };
  }

  /**
   * Filter for critical issues (errors, fatals, or security alerts)
   */
  static critical(): LogFilter {
    return {
      $or: [
        { level: 'fatal' },
        { level: 'error' },
        { securityAlert: true },
      ],
    };
  }

  /**
   * Filter for HTTP errors (4xx and 5xx)
   */
  static httpErrors(): LogFilter {
    return {
      httpResponse: { $gte: 400 },
    };
  }

  /**
   * Filter for logs from a specific user
   */
  static byUser(userId: string): LogFilter {
    return { 'userData.userId': userId };
  }

  /**
   * Filter for logs related to a specific module
   */
  static byModule(moduleId: number): LogFilter {
    return { 'moduleData.moduleId': moduleId };
  }

  /**
   * Filter for logs with specific log levels
   */
  static byLevels(...levels: string[]): LogFilter {
    if (levels.length === 1) {
      return { level: levels[0] };
    }
    return { level: { $in: levels } };
  }

  /**
   * Filter for security-related events
   */
  static security(): LogFilter {
    return {
      $or: [
        { securityAlert: true },
        { level: 'fatal' },
        { httpResponse: { $in: [401, 403] } },
      ],
    };
  }

  /**
   * Filter for successful operations
   */
  static successful(): LogFilter {
    return {
      $and: [
        { httpResponse: { $gte: 200 } },
        { httpResponse: { $lte: 299 } },
      ],
    };
  }

  /**
   * Filter for logs that have debug information
   */
  static withDebugInfo(): LogFilter {
    return { debugObject: { $exists: true } };
  }
}
