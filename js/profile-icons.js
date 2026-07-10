(function () {
  'use strict';

  const ICONS = {
    base: { id: 'base', src: 'sprites/profile-icons/profile_base_jelly.png', ru: '\u041c\u0435\u0434\u0443\u0437\u0430', en: 'Jelly' },
    jor_icon_orange_eye: { id: 'jor_icon_orange_eye', src: 'sprites/profile-icons/profile_orange_eye.png', ru: '\u041e\u0440\u0430\u043d\u0436\u0435\u0432\u044b\u0439 \u0433\u043b\u0430\u0437\u0430\u0441\u0442\u0438\u043a', en: 'Orange Eye' },
    jor_icon_red_fish: { id: 'jor_icon_red_fish', src: 'sprites/profile-icons/profile_red_fish.png', ru: '\u041a\u0440\u0430\u0441\u043d\u0430\u044f \u0440\u044b\u0431\u043a\u0430', en: 'Red Fish' },
    jor_icon_aqua_shell: { id: 'jor_icon_aqua_shell', src: 'sprites/profile-icons/profile_aqua_shell.png', ru: '\u0411\u0438\u0440\u044e\u0437\u043e\u0432\u044b\u0439 \u043f\u0430\u043d\u0446\u0438\u0440\u043d\u0438\u043a', en: 'Aqua Shell' },
    jor_icon_dark_eye: { id: 'jor_icon_dark_eye', src: 'sprites/profile-icons/profile_dark_eye.png', ru: '\u0422\u0451\u043c\u043d\u044b\u0439 \u0433\u043b\u0430\u0437 \u0433\u043b\u0443\u0431\u0438\u043d\u044b', en: 'Deep Eye' },
    jor_icon_gold_shell: { id: 'jor_icon_gold_shell', src: 'sprites/profile-icons/profile_gold_shell.png', ru: '\u0417\u043e\u043b\u043e\u0442\u043e\u0439 \u043f\u0430\u043d\u0446\u0438\u0440\u043d\u0438\u043a', en: 'Gold Shell' },
    jor_icon_ancient_eye: { id: 'jor_icon_ancient_eye', src: 'sprites/profile-icons/profile_ancient_eye.png', ru: '\u041b\u0435\u0432\u0438\u0430\u0444\u0430\u043d', en: 'Leviathan' }
  };

  function getIcon(id) {
    return ICONS[id] || ICONS.base;
  }

  window.JorProfileIcons = { getIcon, icons: ICONS };
})();

