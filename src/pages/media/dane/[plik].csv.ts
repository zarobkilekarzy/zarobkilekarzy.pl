/** Pliki CSV do pobrania generowane w buildzie: /media/dane/<slug>.csv — zob. lib/media/dane.ts */
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { DATASETS, toCsv } from '@/lib/media/dane';

export const getStaticPaths = (() => DATASETS.map((dataset) => ({ params: { plik: dataset.slug }, props: { dataset } }))) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = ({ props }) =>
  new Response(toCsv(props.dataset), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
