import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type AgreementRelations = {
  customerId?: string | null;
  addressId?: string | null;
  objectId?: string | null;
  objectAreaId?: string | null;
};

@Injectable()
export class ServiceAgreementRelationsService {
  async validate(
    transaction: Prisma.TransactionClient,
    companyId: string,
    relations: AgreementRelations,
  ) {
    if (relations.objectAreaId && !relations.objectId) {
      throw new BadRequestException('objectAreaId erfordert objectId.');
    }

    const [customer, address, object, objectArea] = await Promise.all([
      relations.customerId
        ? transaction.customer.findFirst({
            where: { id: relations.customerId, companyId },
            select: { id: true, name: true },
          })
        : null,
      relations.addressId
        ? transaction.address.findFirst({
            where: { id: relations.addressId, companyId },
            select: {
              id: true,
              customerId: true,
              label: true,
              street: true,
              postalCode: true,
              city: true,
              country: true,
            },
          })
        : null,
      relations.objectId
        ? transaction.object.findFirst({
            where: { id: relations.objectId, companyId },
            select: { id: true, name: true, customerId: true, addressId: true },
          })
        : null,
      relations.objectAreaId
        ? transaction.objectArea.findFirst({
            where: { id: relations.objectAreaId, companyId },
            select: { id: true, objectId: true, name: true },
          })
        : null,
    ]);

    if (relations.customerId && !customer) {
      throw new NotFoundException('Kunde wurde in der aktiven Firma nicht gefunden.');
    }
    if (relations.addressId && !address) {
      throw new NotFoundException('Adresse wurde in der aktiven Firma nicht gefunden.');
    }
    if (relations.objectId && !object) {
      throw new NotFoundException('Objekt wurde in der aktiven Firma nicht gefunden.');
    }
    if (relations.objectAreaId && !objectArea) {
      throw new NotFoundException('Objektbereich wurde in der aktiven Firma nicht gefunden.');
    }
    if (objectArea && object && objectArea.objectId !== object.id) {
      throw new BadRequestException('Der Objektbereich gehoert nicht zum ausgewaehlten Objekt.');
    }
    if (customer && address?.customerId && address.customerId !== customer.id) {
      throw new BadRequestException('Die Adresse ist einem anderen Kunden zugeordnet.');
    }
    if (customer && object?.customerId && object.customerId !== customer.id) {
      throw new BadRequestException('Das Objekt ist einem anderen Kunden zugeordnet.');
    }
    if (address && object?.addressId && object.addressId !== address.id) {
      throw new BadRequestException('Das Objekt ist einer anderen Adresse zugeordnet.');
    }

    return { customer, address, object, objectArea };
  }
}
