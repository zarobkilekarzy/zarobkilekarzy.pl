/**
 * Pole `og` we frontmatterze — kształt OgOverride z src/types.ts.
 * Ścisły obiekt: literówka w nazwie pola zatrzymuje build zamiast po cichu nic nie zmieniać.
 */
import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';
import type { Accuracy } from '../../types';
import { PICTOGRAMS, type PictogramName } from '../siatka/piktogramy';

export const ogSchema = ({ image }: SchemaContext) =>
  z
    .strictObject({
      title: z.string().optional(),
      eyebrow: z.string().optional(),
      lead: z.union([z.string(), z.literal(false)]).optional(),
      media: z.enum(['auto', 'photo', 'stat', 'none']).optional(),
      stat: z
        .strictObject({
          value: z.string(),
          unit: z.string().optional(),
          label: z.string().optional(),
          desc: z.string().optional(),
          accuracy: z.enum(['exact', 'est'] satisfies Accuracy[]).optional(),
          source: z.string().optional(),
        })
        .optional(),
      photo: image().optional(),
      illustration: image().optional(),
      position: z.string().optional(),
      badge: z.union([z.string(), z.literal(false)]).optional(),
      image: image().optional(),
      pictogram: z.enum(['ekg', ...Object.keys(PICTOGRAMS)] as ['ekg', ...PictogramName[]]).optional(),
    })
    .optional();
