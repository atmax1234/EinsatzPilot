import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import type {
  WorkdaySheetRowCreateInput,
  WorkdaySheetRowPlannedUpdateInput,
} from '@einsatzpilot/types';

import { OperationsLookupService } from '../operations/operations-lookup.service';

type RowRelations = Pick<
  WorkdaySheetRowCreateInput,
  'customerId' | 'addressId' | 'objectId' | 'objectAreaId' | 'jobId'
>;

@Injectable()
export class WorkdaySheetRelationsService {
  constructor(
    @Inject(OperationsLookupService)
    private readonly operationsLookupService: OperationsLookupService,
  ) {}

  async validateRowRelations(companyId: string, relations: RowRelations) {
    if (relations.objectAreaId && !relations.objectId) {
      throw new BadRequestException('objectAreaId erfordert objectId.');
    }

    const [customer, address, object, objectArea, job] = await Promise.all([
      relations.customerId
        ? this.operationsLookupService.getCustomerForCompanyOrThrow(
            companyId,
            relations.customerId,
          )
        : null,
      relations.addressId
        ? this.operationsLookupService.getAddressForCompanyOrThrow(companyId, relations.addressId)
        : null,
      relations.objectId
        ? this.operationsLookupService.getObjectForCompanyOrThrow(companyId, relations.objectId)
        : null,
      relations.objectAreaId
        ? this.operationsLookupService.getObjectAreaForCompanyOrThrow(
            companyId,
            relations.objectAreaId,
          )
        : null,
      relations.jobId
        ? this.operationsLookupService.getJobForCompanyOrThrow(companyId, relations.jobId)
        : null,
    ]);

    if (objectArea && object && objectArea.objectId !== object.id) {
      throw new BadRequestException('Der Objektbereich gehoert nicht zum ausgewaehlten Objekt.');
    }

    return { customer, address, object, objectArea, job };
  }

  mergeRowRelations(
    current: RowRelations,
    update: WorkdaySheetRowPlannedUpdateInput,
  ): RowRelations {
    return {
      customerId: update.customerId === undefined ? current.customerId : update.customerId ?? undefined,
      addressId: update.addressId === undefined ? current.addressId : update.addressId ?? undefined,
      objectId: update.objectId === undefined ? current.objectId : update.objectId ?? undefined,
      objectAreaId:
        update.objectAreaId === undefined ? current.objectAreaId : update.objectAreaId ?? undefined,
      jobId: update.jobId === undefined ? current.jobId : update.jobId ?? undefined,
    };
  }
}
