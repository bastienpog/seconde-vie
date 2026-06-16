import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCategoriesQuery } from '../../categories/hooks.ts';
import { useMeQuery } from '../../auth/hooks.ts';
import { useItemsQuery } from '../hooks.ts';
import { ItemListPage } from './ItemListPage.tsx';
import type { Item } from '../services/itemsApi.ts';

vi.mock('../hooks.ts', () => ({
  useItemsQuery: vi.fn(),
}));

vi.mock('../../categories/hooks.ts', () => ({
  useCategoriesQuery: vi.fn(),
}));

vi.mock('../../auth/hooks.ts', () => ({
  useMeQuery: vi.fn(),
}));

const mockedUseItemsQuery = vi.mocked(useItemsQuery);
const mockedUseCategoriesQuery = vi.mocked(useCategoriesQuery);
const mockedUseMeQuery = vi.mocked(useMeQuery);

const item: Item = {
  id: 1,
  title: 'Perceuse visseuse',
  description: 'Une perceuse disponible pour le bricolage.',
  city: 'Lyon',
  condition: 'Bon état',
  imageUrl: null,
  status: 'available',
  category: { id: 1, name: 'Bricolage' },
  owner: { id: 1, email: 'owner@example.com' },
  createdAt: '2026-06-01T10:00:00+00:00',
  updatedAt: '2026-06-01T10:00:00+00:00',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ItemListPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockedUseCategoriesQuery.mockReturnValue({
    data: [{ id: 1, name: 'Bricolage', slug: 'bricolage' }],
    isError: false,
  } as unknown as ReturnType<typeof useCategoriesQuery>);

  mockedUseMeQuery.mockReturnValue({
    data: { id: 1, email: 'user@example.com', name: 'User', roles: ['ROLE_USER'] },
  } as unknown as ReturnType<typeof useMeQuery>);
});

describe('ItemListPage', () => {
  it('affiche un état de chargement', () => {
    mockedUseItemsQuery.mockReturnValue({
      isLoading: true,
      isError: false,
      isSuccess: false,
    } as unknown as ReturnType<typeof useItemsQuery>);

    const { container } = renderPage();

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(8);
  });

  it("affiche l'état d'erreur", () => {
    mockedUseItemsQuery.mockReturnValue({
      isLoading: false,
      isError: true,
      isSuccess: false,
    } as unknown as ReturnType<typeof useItemsQuery>);

    renderPage();

    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
    expect(screen.getByText('Impossible de charger les objets pour le moment.')).toBeInTheDocument();
  });

  it('affiche un état vide', () => {
    mockedUseItemsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useItemsQuery>);

    renderPage();

    expect(screen.getByText('Aucun objet trouvé')).toBeInTheDocument();
    expect(screen.getByText('Essayez avec un autre mot-clé, une autre ville ou une autre catégorie.')).toBeInTheDocument();
  });

  it('affiche les objets disponibles', () => {
    mockedUseItemsQuery.mockReturnValue({
      data: [item],
      isLoading: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useItemsQuery>);

    renderPage();

    expect(screen.getByRole('heading', { name: 'Perceuse visseuse' })).toBeInTheDocument();
    expect(screen.getByText('Lyon')).toBeInTheDocument();
  });
});
