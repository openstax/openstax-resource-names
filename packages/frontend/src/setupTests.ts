import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('@project/lambdas/build/routeData.json', () => ({ default: {} }));
