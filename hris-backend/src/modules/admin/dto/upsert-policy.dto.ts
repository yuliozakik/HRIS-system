import { IsDefined } from 'class-validator';

export class UpsertPolicyDto {
  /** Any JSON-serializable value; shape is intentionally not constrained here. */
  @IsDefined()
  value: any;
}
