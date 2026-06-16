import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ItemForm } from './ItemForm.tsx';
import { useCategoriesQuery } from '../../categories/hooks.ts';

vi.mock('../../categories/hooks.ts', () => ({
  useCategoriesQuery: vi.fn(),
}));

const mockedUseCategoriesQuery = vi.mocked(useCategoriesQuery);

function mockCategoriesSuccess() {
  mockedUseCategoriesQuery.mockReturnValue({
    data: [
      { id: 1, name: 'Bricolage', slug: 'bricolage' },
      { id: 2, name: 'Cuisine', slug: 'cuisine' },
    ],
    isError: false,
    isLoading: false,
    isSuccess: true,
  } as unknown as ReturnType<typeof useCategoriesQuery>);
}

describe('ItemForm', () => {
  it('soumet les champs valides au format attendu', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    mockCategoriesSuccess();

    render(<ItemForm error={null} isPending={false} mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/url de l'image/i), 'https://example.com/perceuse.jpg');
    await user.type(screen.getByLabelText(/titre de l'objet/i), 'Perceuse visseuse');
    await user.selectOptions(screen.getByLabelText(/catégorie/i), '1');
    await user.type(screen.getByLabelText(/ville/i), 'Lyon');
    await user.selectOptions(screen.getByLabelText(/état/i), 'Bon état');
    await user.type(screen.getByLabelText(/description/i), 'Disponible le week-end pour petits travaux.');
    await user.click(screen.getByRole('button', { name: /publier l'objet/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Perceuse visseuse',
      description: 'Disponible le week-end pour petits travaux.',
      city: 'Lyon',
      condition: 'Bon état',
      categoryId: 1,
      imageUrl: 'https://example.com/perceuse.jpg',
    });
  });

  it('affiche les erreurs locales sans soumettre un formulaire invalide', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    mockCategoriesSuccess();

    render(<ItemForm error={null} isPending={false} mode="create" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /publier l'objet/i }));

    expect(await screen.findByText('Le titre est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('La catégorie est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('La ville est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText("L'état est obligatoire.")).toBeInTheDocument();
    expect(screen.getByText('La description est obligatoire.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
