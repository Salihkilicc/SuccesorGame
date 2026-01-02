// Re-export types from the feature module to maintain Clean Architecture
// The feature "owns" its domain data.
import { Product, ProductStatus, CompetitionLevel } from '../features/products/data/productsData';

export type { Product, ProductStatus, CompetitionLevel };

// If there are other global types, they should be listed below. 
// Based on previous reads, this file ONLY contained Product types.
