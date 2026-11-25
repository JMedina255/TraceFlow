import { SetMetadata } from '@nestjs/common';
import type { CanonicalRoleId } from '../types/index.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: CanonicalRoleId[]) => SetMetadata(ROLES_KEY, roles);
