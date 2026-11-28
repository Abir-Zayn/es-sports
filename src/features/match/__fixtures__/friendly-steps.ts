import { fireEvent, screen } from '@testing-library/react-native';

/** How the matchup card and its menus name each side, whatever the team is called. */
export type SideLabel = 'Team A' | 'Team B';

/** Renames a side on the matchup card: tap its name, type, press done. */
export async function renameSide(side: SideLabel, name: string) {
  await fireEvent.press(screen.getByRole('button', { name: `Edit ${side} name` }));
  const field = screen.getByLabelText(`${side} name`);
  await fireEvent.changeText(field, name);
  await fireEvent(field, 'submitEditing');
}

/** Opens a side's ••• menu and picks the action with that title, e.g. "View squad". */
export async function sideAction(side: SideLabel, title: string) {
  await fireEvent.press(screen.getByRole('button', { name: `More options for ${side}` }));
  await fireEvent.press(screen.getByRole('button', { name: new RegExp(`^${title}\\.`) }));
}

/** Adds a guest to a side from its menu. */
export async function quickAdd(side: SideLabel, name: string) {
  await sideAction(side, 'Quick add a guest');
  await fireEvent.changeText(screen.getByLabelText('Player name'), name);
  await fireEvent.press(screen.getByRole('button', { name: 'Add to squad' }));
}

/** Four a side, both teams named and full: the creator and three guests in Team A, four guests in Team B. */
export async function fillFriendlyForm() {
  await fireEvent.press(screen.getByRole('button', { name: 'Fewer players a side' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Fewer players a side' }));
  await renameSide('Team A', 'Karnaphuli Kings');
  await renameSide('Team B', 'Chattogram Strikers');
  await sideAction('Team A', 'Add me');
  for (const name of ['Rafi Hasan', 'Imran Kayes', 'Sumon Das']) await quickAdd('Team A', name);
  for (const name of ['Liton Roy', 'Nayeem Islam', 'Tanvir Ahmed', 'Arif Khan']) await quickAdd('Team B', name);
}
