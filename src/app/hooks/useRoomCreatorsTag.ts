import { useTranslation } from 'react-i18next';
import { MemberPowerTag } from '../../types/matrix/room';

export const useRoomCreatorsTag = (): MemberPowerTag => {
  const { t } = useTranslation();
  return {
    name: t('Organisms.PowerTag.founder'),
    color: '#0000ff',
  };
};
