import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class LocalFileStorageService {
  private readonly baseDir = path.resolve(
    process.cwd(),
    process.env.LOCAL_UPLOADS_DIR?.trim() || 'apps/api/storage/uploads',
  );

  private async ensureBaseDir() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  async saveFile(input: {
    companyId: string;
    jobId: string;
    originalName: string;
    buffer: Buffer;
  }) {
    await this.ensureBaseDir();

    const extension = path.extname(input.originalName);
    const fileName = `${randomUUID()}${extension}`;
    const relativeDir = path.join(input.companyId, input.jobId);
    const relativePath = path.join(relativeDir, fileName);
    const absoluteDir = path.join(this.baseDir, relativeDir);
    const absolutePath = path.join(this.baseDir, relativePath);

    await fs.mkdir(absoluteDir, { recursive: true });
    await fs.writeFile(absolutePath, input.buffer);

    return {
      storagePath: relativePath.split(path.sep).join('/'),
      absolutePath,
    };
  }

  async readFile(storagePath: string) {
    const normalizedPath = storagePath.split('/').join(path.sep);
    const absolutePath = path.join(this.baseDir, normalizedPath);

    if (!absolutePath.startsWith(this.baseDir)) {
      throw new InternalServerErrorException('Ungueltiger Speicherpfad.');
    }

    try {
      const fileBuffer = await fs.readFile(absolutePath);
      return {
        absolutePath,
        fileBuffer,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException('Datei nicht gefunden.');
      }

      throw error;
    }
  }
}
