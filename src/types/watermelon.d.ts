import '@nozbe/watermelondb/decorators';

declare module '@nozbe/watermelondb/decorators' {
  export function text(columnName: string): PropertyDecorator;
  export function date(columnName: string): PropertyDecorator;
  export function field(columnName: string): PropertyDecorator;
  export function readonly(): PropertyDecorator;
  export function children(table: string): PropertyDecorator;
  export function relation(
    relationName: string,
    foreignKey: string,
  ): PropertyDecorator;
}
