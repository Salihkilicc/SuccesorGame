// Re-export types from the feature module to maintain Clean Architecture
// The feature "owns" its domain data.
import { Product, ProductStatus } from '../features/products/data/productsData';
import {
    Ethnicity,
    SocialClass,
    PartnerStats,
    PartnerProfile,
    ExPartnerProfile,
    MarriageProposalResult,
    BREAKUP_REASONS,
} from './relationshipTypes';

export type { Product, ProductStatus };

// Relationship Engine Types
export type {
    Ethnicity,
    SocialClass,
    PartnerStats,
    PartnerProfile,
    ExPartnerProfile,
    MarriageProposalResult,
};

export { BREAKUP_REASONS };
