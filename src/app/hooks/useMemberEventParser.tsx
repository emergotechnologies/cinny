import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSrc, Icons } from 'folds';
import { MatrixEvent } from 'matrix-js-sdk';
import { IMemberContent, Membership } from '../../types/matrix/room';
import { getMxIdLocalPart } from '../utils/matrix';
import { isMembershipChanged } from '../utils/room';

export type ParsedResult = {
  icon: IconSrc;
  body: ReactNode;
};

export type MemberEventParser = (mEvent: MatrixEvent) => ParsedResult;

export const useMemberEventParser = (): MemberEventParser => {
  const { t } = useTranslation();

  const parseMemberEvent: MemberEventParser = (mEvent) => {
    const content = mEvent.getContent<IMemberContent>();
    const prevContent = mEvent.getPrevContent() as IMemberContent;
    const senderId = mEvent.getSender();
    const userId = mEvent.getStateKey();
    const reason = typeof content.reason === 'string' ? content.reason : undefined;

    if (!senderId || !userId)
      return {
        icon: Icons.User,
        body: t('Organisms.MemberEvent.broken_event'),
      };

    const senderName = getMxIdLocalPart(senderId);
    const userName =
      typeof content.displayname === 'string'
        ? content.displayname || getMxIdLocalPart(userId)
        : getMxIdLocalPart(userId);

    if (isMembershipChanged(mEvent)) {
      if (content.membership === Membership.Invite) {
        if (prevContent.membership === Membership.Knock) {
          return {
            icon: Icons.ArrowGoRightPlus,
            body: (
              <>
                <b>{senderName}</b>
                {t('Organisms.MemberEvent.accepted_join_request_pre')}
                <b>{userName}</b>
                {t('Organisms.MemberEvent.accepted_join_request_post')}
                {reason}
              </>
            ),
          };
        }

        return {
          icon: Icons.ArrowGoRightPlus,
          body: (
            <>
              <b>{senderName}</b>
              {t('Organisms.MemberEvent.invited_pre')}
              <b>{userName}</b>
              {t('Organisms.MemberEvent.invited_post')}
              {reason}
            </>
          ),
        };
      }

      if (content.membership === Membership.Knock) {
        return {
          icon: Icons.ArrowGoRightPlus,
          body: (
            <>
              <b>{userName}</b>
              {t('Organisms.MemberEvent.request_to_join')}
              {reason}
            </>
          ),
        };
      }

      if (content.membership === Membership.Join) {
        return {
          icon: Icons.ArrowGoRight,
          body: (
            <>
              <b>{userName}</b>
              {t('Organisms.MemberEvent.joined_the_room')}
            </>
          ),
        };
      }

      if (content.membership === Membership.Leave) {
        if (prevContent.membership === Membership.Invite) {
          return {
            icon: Icons.ArrowGoRightCross,
            body:
              senderId === userId ? (
                <>
                  <b>{userName}</b>
                  {t('Organisms.MemberEvent.rejected_invitation')}
                  {reason}
                </>
              ) : (
                <>
                  <b>{senderName}</b>
                  {t('Organisms.MemberEvent.rejected_join_request_pre')}
                  <b>{userName}</b>
                  {t('Organisms.MemberEvent.rejected_join_request_post')}
                  {reason}
                </>
              ),
          };
        }

        if (prevContent.membership === Membership.Knock) {
          return {
            icon: Icons.ArrowGoRightCross,
            body:
              senderId === userId ? (
                <>
                  <b>{userName}</b>
                  {t('Organisms.MemberEvent.revoked_join_request')}
                  {reason}
                </>
              ) : (
                <>
                  <b>{senderName}</b>
                  {t('Organisms.MemberEvent.revoked_invite_pre')}
                  <b>{userName}</b>
                  {t('Organisms.MemberEvent.revoked_invite_post')}
                  {reason}
                </>
              ),
          };
        }

        if (prevContent.membership === Membership.Ban) {
          return {
            icon: Icons.ArrowGoLeft,
            body: (
              <>
                <b>{senderName}</b>
                {t('Organisms.MemberEvent.unbanned_pre')}
                <b>{userName}</b>
                {t('Organisms.MemberEvent.unbanned_post')}
                {reason}
              </>
            ),
          };
        }

        return {
          icon: Icons.ArrowGoLeft,
          body:
            senderId === userId ? (
              <>
                <b>{userName}</b>
                {t('Organisms.MemberEvent.left_the_room')}
                {reason}
              </>
            ) : (
              <>
                <b>{senderName}</b>
                {t('Organisms.MemberEvent.kicked_pre')}
                <b>{userName}</b>
                {t('Organisms.MemberEvent.kicked_post')}
                {reason}
              </>
            ),
        };
      }

      if (content.membership === Membership.Ban) {
        return {
          icon: Icons.ArrowGoLeft,
          body: (
            <>
              <b>{senderName}</b>
              {t('Organisms.MemberEvent.banned_pre')}
              <b>{userName}</b>
              {t('Organisms.MemberEvent.banned_post')}
              {reason}
            </>
          ),
        };
      }
    }

    if (content.displayname !== prevContent.displayname) {
      const prevUserName =
        typeof prevContent.displayname === 'string'
          ? prevContent.displayname || getMxIdLocalPart(userId)
          : getMxIdLocalPart(userId);

      return {
        icon: Icons.Mention,
        body:
          typeof content.displayname === 'string' ? (
            <>
              <b>{prevUserName}</b>
              {t('Organisms.MemberEvent.changed_display_name_to')}
              <b>{userName}</b>
            </>
          ) : (
            <>
              <b>{prevUserName}</b>
              {t('Organisms.MemberEvent.removed_display_name')}
            </>
          ),
      };
    }

    if (content.avatar_url !== prevContent.avatar_url) {
      return {
        icon: Icons.User,
        body:
          content.avatar_url && typeof content.avatar_url === 'string' ? (
            <>
              <b>{userName}</b>
              {t('Organisms.MemberEvent.changed_avatar')}
            </>
          ) : (
            <>
              <b>{userName}</b>
              {t('Organisms.MemberEvent.removed_avatar')}
            </>
          ),
      };
    }

    return {
      icon: Icons.User,
      body: t('Organisms.MemberEvent.no_changes'),
    };
  };

  return parseMemberEvent;
};
