/**
 * Filter operators for log queries (MongoDB-inspired syntax)
 */
export type FilterOperator = 
  | '$eq'      // equals
  | '$ne'      // not equals
  | '$in'      // in array
  | '$nin'     // not in array
  | '$gt'      // greater than
  | '$gte'     // greater than or equal
  | '$lt'      // less than
  | '$lte'     // less than or equal
  | '$exists'  // field exists
  | '$regex'   // regex match
  | '$and'     // logical AND
  | '$or';     // logical OR

/**
 * Valid filter values
 */
export type FilterValue = string | number | boolean | null | FilterValue[];

/**
 * A single filter condition with field and operator
 */
export interface FilterCondition {
  [key: string]: FilterValue | { [op in FilterOperator]?: FilterValue };
}

/**
 * Complete log filter with optional logical operators
 */
export interface LogFilter {
  $and?: FilterCondition[];
  $or?: FilterCondition[];
  [key: string]: any;
}
