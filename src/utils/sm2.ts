export interface SM2Result {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

export const calculateSM2 = (
  quality: number,
  repetitions: number,
  easinessFactor: number,
  interval: number
): SM2Result => {
  let newEasinessFactor = easinessFactor;
  let newRepetitions = repetitions;
  let newInterval = interval;

  if (quality >= 3) {
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easinessFactor);
    }
    newRepetitions += 1;
  } else {
    newRepetitions = 0;
    newInterval = 1;
  }

  newEasinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (newEasinessFactor < 1.3) {
    newEasinessFactor = 1.3;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    easinessFactor: newEasinessFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
  };
};

export const getQualityDescription = (quality: number): string => {
  const descriptions: { [key: number]: string } = {
    0: 'Полный провал - не помню совсем',
    1: 'Неправильно - но что-то показалось знакомым',
    2: 'Неправильно - но почти вспомнил',
    3: 'Правильно - но с трудом',
    4: 'Правильно - после размышления',
    5: 'Правильно - сразу и легко',
  };
  return descriptions[quality] || '';
};
