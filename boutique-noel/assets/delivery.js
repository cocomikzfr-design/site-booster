/* Noël en Façade — dates de livraison estimées et compte à rebours jusqu'à la vraie date limite.
   Calculs à l'heure de Bruxelles, identiques pour tous les visiteurs (aucun cookie, aucun stockage local). */
(() => {
  const config = window.themeConfig || {};
  const strings = config.strings || {};
  const delivery = config.delivery || {};
  const deadlineConfig = config.deadline || {};
  const TIME_ZONE = 'Europe/Brussels';
  const TICK_MS = 30000;

  const partsFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

  const shortDate = new Intl.DateTimeFormat('fr-BE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  });

  function partsInTimeZone(date) {
    return Object.fromEntries(
      partsFormatter
        .formatToParts(date)
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)])
    );
  }

  function nowInBrussels() {
    return partsInTimeZone(new Date());
  }

  function zonedTimeToDate(year, month, day, hour, minute) {
    const guess = Date.UTC(year, month - 1, day, hour, minute);
    const parts = partsInTimeZone(new Date(guess));
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    return new Date(guess - (asUtc - guess));
  }

  function deadlineDate(value) {
    const source = value || `${deadlineConfig.date || ''} ${deadlineConfig.time || '23:59'}`;
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(source.trim());
    if (!match) return null;
    const [, year, month, day, hour = '23', minute = '59'] = match;
    const date = zonedTimeToDate(Number(year), Number(month), Number(day), Number(hour), Number(minute));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function calendarDay(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  function todayInBrussels() {
    const parts = nowInBrussels();
    return calendarDay(parts.year, parts.month, parts.day);
  }

  function christmasDay() {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((deadlineConfig.christmas || '').trim());
    return match ? calendarDay(Number(match[1]), Number(match[2]), Number(match[3])) : null;
  }

  function addDays(start, days, skipSundays) {
    const result = new Date(start.getTime());
    let added = 0;
    while (added < days) {
      result.setUTCDate(result.getUTCDate() + 1);
      if (skipSundays && result.getUTCDay() === 0) continue;
      added += 1;
    }
    return result;
  }

  function isDeadlinePassed() {
    const deadline = deadlineDate();
    return Boolean(deadline) && Date.now() >= deadline.getTime();
  }

  function applyDeadlineState() {
    if (config.seasonMode !== 'christmas' || !deadlineDate()) return;
    const passed = isDeadlinePassed();
    document.querySelectorAll('[data-deadline-before]').forEach((element) => {
      element.hidden = passed;
    });
    document.querySelectorAll('[data-deadline-after]').forEach((element) => {
      element.hidden = !passed;
    });
  }

  function unitLabel(unit, value) {
    const singular = { days: strings.daysOne, hours: strings.hoursOne, minutes: strings.minutesOne };
    const plural = { days: strings.daysLong, hours: strings.hoursLong, minutes: strings.minutesLong };
    return (value < 2 ? singular[unit] : plural[unit]) || '';
  }

  class DeliveryEstimate extends HTMLElement {
    connectedCallback() {
      this.render();
    }

    render() {
      const min = Number(delivery.min);
      const max = Math.max(min, Number(delivery.max));
      if (!min || !max) return;

      const today = todayInBrussels();
      const start = addDays(today, min, delivery.skipSundays);
      const end = addDays(today, max, delivery.skipSundays);

      const text = this.querySelector('[data-delivery-text]');
      const template = this.dataset.format === 'range' ? strings.range : strings.estimate;
      if (text && template) {
        text.textContent = template.replace('[start]', shortDate.format(start)).replace('[end]', shortDate.format(end));
      }

      const warning = this.querySelector('[data-delivery-after]');
      if (warning && config.seasonMode === 'christmas') {
        const christmas = christmasDay();
        warning.hidden = !(isDeadlinePassed() || (christmas && end > christmas));
      }
    }
  }

  class DeadlineCountdown extends HTMLElement {
    connectedCallback() {
      this.deadline = deadlineDate(this.dataset.deadline);
      if (!this.deadline || !this.querySelector('[data-countdown-digits]')) return;
      this.summary = this.querySelector('[data-countdown-summary]');
      this.useLongLabels = this.dataset.style === 'blocks';
      this.tick = this.tick.bind(this);
      this.onVisibilityChange = () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.tick();
          this.start();
        }
      };
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.tick();
      this.start();
    }

    disconnectedCallback() {
      this.stop();
      if (this.onVisibilityChange) document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }

    start() {
      this.stop();
      if (!this.finished) this.timer = window.setInterval(this.tick, TICK_MS);
    }

    stop() {
      window.clearInterval(this.timer);
    }

    tick() {
      const remaining = this.deadline.getTime() - Date.now();
      if (remaining <= 0) {
        this.finish();
        return;
      }

      const totalMinutes = Math.floor(remaining / 60000);
      const values = {
        days: Math.floor(totalMinutes / 1440),
        hours: Math.floor((totalMinutes % 1440) / 60),
        minutes: totalMinutes % 60
      };

      Object.entries(values).forEach(([unit, value]) => {
        const valueElement = this.querySelector(`[data-unit-value="${unit}"]`);
        if (valueElement) valueElement.textContent = unit === 'days' ? String(value) : String(value).padStart(2, '0');
        if (this.useLongLabels) {
          const labelElement = this.querySelector(`[data-unit-label="${unit}"]`);
          if (labelElement) labelElement.textContent = unitLabel(unit, value);
        }
      });

      if (this.summary && strings.countdownSummary && totalMinutes !== this.lastSummaryMinutes) {
        this.lastSummaryMinutes = totalMinutes;
        this.summary.textContent = strings.countdownSummary
          .replace('[days]', values.days)
          .replace('[days_unit]', unitLabel('days', values.days))
          .replace('[hours]', values.hours)
          .replace('[hours_unit]', unitLabel('hours', values.hours))
          .replace('[minutes]', values.minutes)
          .replace('[minutes_unit]', unitLabel('minutes', values.minutes));
      }
    }

    finish() {
      this.finished = true;
      this.stop();
      const message = document.createElement('p');
      message.className = 'countdown__passed';
      message.textContent = strings.deadlinePassed || '';
      this.replaceChildren(message);
      applyDeadlineState();
      document.querySelectorAll('delivery-estimate').forEach((estimate) => estimate.render());
    }
  }

  if (!customElements.get('delivery-estimate')) customElements.define('delivery-estimate', DeliveryEstimate);
  if (!customElements.get('deadline-countdown')) customElements.define('deadline-countdown', DeadlineCountdown);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyDeadlineState);
  else applyDeadlineState();

  document.addEventListener('shopify:section:load', applyDeadlineState);
})();
