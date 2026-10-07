import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

export type AppIconName = ComponentProps<typeof SymbolView>['name'];

/**
 * Catálogo único de ícones (SF Symbols no iOS, Material Symbols no Android/web).
 * Use sempre `AppIcon name="..."` com uma destas chaves para manter o traço consistente.
 */
export const Icons = {
  home: { ios: 'house', android: 'home', web: 'home' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  students: { ios: 'person.2', android: 'group', web: 'group' },
  student: { ios: 'person', android: 'person', web: 'person' },
  message: { ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' },
  megaphone: { ios: 'megaphone', android: 'campaign', web: 'campaign' },
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  classes: { ios: 'books.vertical', android: 'local_library', web: 'local_library' },
  book: { ios: 'book.closed', android: 'menu_book', web: 'menu_book' },
  users: { ios: 'person.3', android: 'groups', web: 'groups' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
  lock: { ios: 'lock', android: 'lock', web: 'lock' },
  eye: { ios: 'eye', android: 'visibility', web: 'visibility' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  filter: { ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  checkCircle: { ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  location: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  bell: { ios: 'bell', android: 'notifications', web: 'notifications' },
  help: { ios: 'questionmark.circle', android: 'help', web: 'help' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  shield: { ios: 'lock.shield', android: 'shield_lock', web: 'shield_lock' },
  alert: { ios: 'exclamationmark.circle', android: 'error', web: 'error' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  attendance: { ios: 'checklist', android: 'fact_check', web: 'fact_check' },
  notes: { ios: 'note.text', android: 'sticky_note_2', web: 'sticky_note_2' },
  activity: { ios: 'pencil.and.outline', android: 'edit_note', web: 'edit_note' },
  break: { ios: 'cup.and.saucer', android: 'coffee', web: 'coffee' },
  therapy: { ios: 'heart', android: 'favorite', web: 'favorite' },
  event: { ios: 'star', android: 'star', web: 'star' },
  more: { ios: 'ellipsis.circle', android: 'more_horiz', web: 'more_horiz' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  key: { ios: 'key', android: 'key', web: 'key' },
  share: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
  chart: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' },
} as const satisfies Record<string, AppIconName>;

export type IconKey = keyof typeof Icons;

type AppIconProps = {
  name: IconKey;
  color: string;
  size?: number;
};

export function AppIcon({ name, color, size = 20 }: AppIconProps) {
  return <SymbolView name={Icons[name]} tintColor={color} size={size} />;
}
