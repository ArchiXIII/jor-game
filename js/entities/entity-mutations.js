function getMutationLevel(id) {
      const levels = {
        spike: player?.spikeLevel ?? 0,
        tail: player?.tailLevel ?? 0,
        shell: player?.shellLevel ?? 0,
        maw: player?.mawLevel ?? 0,
        dash: player?.dashLevel ?? 0,
        tentacle: player?.tentacleLevel ?? 0,
        shatter: player?.shatterLevel ?? 0,
        agility: player?.agilityLevel ?? 0,
      };

      return levels[id] ?? 0;
    }

    function getMutationStackText(id, nextLevel) {
      const descriptions = i18n[currentLang]?.mutationStackText ?? i18n.ru.mutationStackText;
      const formatter = descriptions[id];
      return typeof formatter === 'function' ? formatter(nextLevel) : '';
    }

    let mutationOfferCounts = {};

    function ensureMutationOfferCounts() {
      for (const id of Object.keys(mutationCatalog)) {
        if (typeof mutationOfferCounts[id] !== 'number') {
          mutationOfferCounts[id] = 0;
        }
      }
    }

    // Равномерное перемешивание вместо sort(() => Math.random() - 0.5).
    function shuffleArray(items) {
      const result = [...items];

      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }

      return result;
    }

    function pickBalancedMutationIds(count, excludeIds = []) {
      ensureMutationOfferCounts();

      const excluded = new Set(excludeIds);
      const available = Object.keys(mutationCatalog).filter(id => !excluded.has(id));
      const chosen = [];

      while (chosen.length < count && available.length) {
        const remaining = available.filter(id => !chosen.includes(id));
        if (!remaining.length) break;

        const minOffers = Math.min(...remaining.map(id => mutationOfferCounts[id]));
        const leastOffered = remaining.filter(id => mutationOfferCounts[id] === minOffers);
        const nextId = shuffleArray(leastOffered)[0];

        mutationOfferCounts[nextId] += 1;
        chosen.push(nextId);
      }

      return chosen;
    }

    function getMutationChoices() {
      const ids = pickBalancedMutationIds(2);
      return ids.map(id => mutationCatalog[id]);
    }

    function getRewardMutationChoice(existingChoices) {
      const existingIds = existingChoices.map(item => item.id);
      const nextId = pickBalancedMutationIds(1, existingIds)[0];
      return nextId ? mutationCatalog[nextId] : null;
    }

    // ------------------------------
    // Игровое состояние
    // ------------------------------
