import { Dialog, ThemePicker, useTheme } from '@yewdiel21/motion-kit/react';
import { Palette, X } from 'lucide-react';
import { SegmentedControl } from './KitControls';

export default function AppearanceDialog() {
  const theme = useTheme();
  return (
    <Dialog.Root>
      <Dialog.Trigger
        className="mk-nav__button mk-nav__button--action"
        aria-label="Personalizar interfaz"
      >
        <span className="mk-nav__icon">
          <Palette size={22} />
        </span>
        <span className="mk-nav__name">Apariencia</span>
      </Dialog.Trigger>
      <Dialog.Content size="lg" aria-labelledby="appearance-title">
        <Dialog.Header>
          <div>
            <span className="eyebrow">TU ESPACIO, A TU MANERA</span>
            <Dialog.Title id="appearance-title">Apariencia</Dialog.Title>
          </div>
          <Dialog.Close aria-label="Cerrar apariencia">
            <X size={21} />
          </Dialog.Close>
        </Dialog.Header>
        <Dialog.Body>
          <div className="settings-stack">
            <div>
              <h3 className="mk-type-title-medium">Paleta de color</h3>
              <p className="supporting-text">
                Temas originales de Motion Kit. Toda la interfaz sigue la paleta que elijas.
              </p>
            </div>
            <ThemePicker
              themes={['orange', 'blue', 'purple', 'neogreen', 'brown', 'oled']}
              showHidden
              labels={{ group: 'Paletas de Motion Kit' }}
            />
            <div>
              <h3 className="mk-type-title-medium">Modo de pantalla</h3>
              <SegmentedControl
                label="Modo de pantalla"
                value={theme.mode}
                onChange={theme.setMode}
                options={[
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Oscuro' },
                  { value: 'system', label: 'Sistema' },
                ]}
              />
            </div>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <button type="button" data-mk-close="" className="mk-button mk-button--primary">
            Listo
          </button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
