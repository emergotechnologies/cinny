import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RoomMember } from 'matrix-js-sdk';
import { Membership } from '../../types/matrix/room';

export const MembershipFilter = {
  filterJoined: (m: RoomMember) => m.membership === Membership.Join,
  filterInvited: (m: RoomMember) => m.membership === Membership.Invite,
  filterLeaved: (m: RoomMember) =>
    m.membership === Membership.Leave &&
    m.events.member?.getStateKey() === m.events.member?.getSender(),
  filterKicked: (m: RoomMember) =>
    m.membership === Membership.Leave &&
    m.events.member?.getStateKey() !== m.events.member?.getSender(),
  filterBanned: (m: RoomMember) => m.membership === Membership.Ban,
};

export type MembershipFilterFn = (m: RoomMember) => boolean;

export type MembershipFilterItem = {
  name: string;
  filterFn: MembershipFilterFn;
};

export const useMembershipFilterMenu = (): MembershipFilterItem[] => {
  const { t } = useTranslation();
  return useMemo(
    () => [
      {
        name: t('Organisms.MemberFilter.joined'),
        filterFn: MembershipFilter.filterJoined,
      },
      {
        name: t('Organisms.MemberFilter.invited'),
        filterFn: MembershipFilter.filterInvited,
      },
      {
        name: t('Organisms.MemberFilter.left'),
        filterFn: MembershipFilter.filterLeaved,
      },
      {
        name: t('Organisms.MemberFilter.kicked'),
        filterFn: MembershipFilter.filterKicked,
      },
      {
        name: t('Organisms.MemberFilter.banned'),
        filterFn: MembershipFilter.filterBanned,
      },
    ],
    [t]
  );
};

export const useMembershipFilter = (
  index: number,
  membershipFilter: MembershipFilterItem[]
): MembershipFilterItem => {
  const filter = membershipFilter[index] ?? membershipFilter[0];
  return filter;
};
