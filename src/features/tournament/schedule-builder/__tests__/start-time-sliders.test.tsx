import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { StartTimeSliders } from '../components/start-time-sliders';

async function show(value: number, onChange = jest.fn()) {
  await render(
    <ThemeProvider>
      <StartTimeSliders value={value} onChange={onChange} />
    </ThemeProvider>,
  );
  return onChange;
}

describe('StartTimeSliders', () => {
  it('renders current hour and minute labels and clamps non-finite values safely', async () => {
    await show(9 * 60 + 25);
    expect(screen.getByText('9 AM')).toBeTruthy();
    expect(screen.getByText('25 min')).toBeTruthy();

    await show(Number.NaN);
    expect(screen.getByText('12 AM')).toBeTruthy();
    expect(screen.getByText('00 min')).toBeTruthy();
  });

  it('updates hour and minutes via accessibility increment/decrement and track layout/touch', async () => {
    const onChange = await show(9 * 60 + 15);
    const hourSlider = screen.getByRole('adjustable', { name: 'Start hour' });
    const minSlider = screen.getByRole('adjustable', { name: 'Start minutes' });

    await fireEvent(hourSlider, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenLastCalledWith(10 * 60 + 15);

    await fireEvent(minSlider, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onChange).toHaveBeenLastCalledWith(9 * 60 + 14);

    // Measure track width, tap near the start, then drag right via responderMove.
    await fireEvent(minSlider, 'layout', { nativeEvent: { layout: { width: 300 } } });
    await fireEvent(minSlider, 'responderGrant', { nativeEvent: { locationX: 12, pageX: 20 } });
    expect(onChange).toHaveBeenLastCalledWith(9 * 60 + 0);
    await fireEvent(minSlider, 'responderMove', { nativeEvent: { locationX: 295, pageX: 300 } });
    expect(onChange).toHaveBeenLastCalledWith(9 * 60 + 59);
  });
});
