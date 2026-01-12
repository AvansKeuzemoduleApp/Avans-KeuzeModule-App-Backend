import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Array<'student' | 'teacher'>) =>
    SetMetadata(ROLES_KEY, roles.map((r) => String(r).trim()).filter(Boolean));
