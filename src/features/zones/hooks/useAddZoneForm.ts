import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { TextInput } from 'react-native';

import { getTimeZoneOption } from '../utils/timeZoneDisplay';
import type { TimeZoneOption } from '../utils/timeZoneDisplay';
import { normalizeTimeZoneId } from '../utils/timeZoneUtils';
import type { Zone } from '../storage/zonesRepository';

const normalizeLabelValue = (value: string) => value.trim().toLowerCase();

type UseAddZoneFormOptions = {
  visible: boolean;
  mode?: 'add' | 'edit';
  initialValue?: Zone;
  startedInEdit: boolean;
  onSubmit: (zone: Zone) => void;
  onSubmitAtStart?: (zone: Zone) => void;
  onClose: () => void;
  onSelectExisting?: (index: number) => void;
  onReturnToAdd?: () => void;
  allTimeZoneOptions: TimeZoneOption[];
  language: string;
  setSearch: (value: string) => void;
  setIsSearchFocused: (value: boolean) => void;
  searchInputRef: RefObject<TextInput | null>;
  findExistingMatch: (option: TimeZoneOption) => { zone: Zone; index: number } | null;
  getOptionLabelKeys: (option: TimeZoneOption) => Set<string>;
  getCityLabel: (option: TimeZoneOption) => string;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function useAddZoneForm({
  visible,
  mode,
  initialValue,
  startedInEdit,
  onSubmit,
  onSubmitAtStart,
  onClose,
  onSelectExisting,
  onReturnToAdd,
  allTimeZoneOptions,
  language,
  setSearch,
  setIsSearchFocused,
  searchInputRef,
  findExistingMatch,
  getOptionLabelKeys,
  getCityLabel,
  t,
}: UseAddZoneFormOptions) {
  const [label, setLabel] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [error, setError] = useState('');
  const [labelWasCleared, setLabelWasCleared] = useState(false);
  const skipResetOnClearRef = useRef(false);
  const isEdit = mode === 'edit' || Boolean(initialValue);

  useEffect(() => {
    if (!visible) return;
    if (initialValue) {
      const normalized = normalizeTimeZoneId(initialValue.timeZone);
      const option =
        allTimeZoneOptions.find((item) => item.id === normalized) ??
        getTimeZoneOption(normalized, language);
      setLabel(initialValue.label);
      setTimeZone(option.timeZoneId);
      setMembersInput(initialValue.members?.join(', ') ?? '');
      setSearch(option.label);
      setError('');
      setIsSearchFocused(false);
      setLabelWasCleared(false);
      return;
    }
    if (skipResetOnClearRef.current) {
      skipResetOnClearRef.current = false;
      return;
    }
    setLabel('');
    setTimeZone('');
    setMembersInput('');
    setSearch('');
    setError('');
    setIsSearchFocused(false);
    setLabelWasCleared(false);
  }, [allTimeZoneOptions, visible, initialValue]);

  const reset = () => {
    setLabel('');
    setTimeZone('');
    setMembersInput('');
    setSearch('');
    setError('');
    setLabelWasCleared(false);
  };

  const closeSearchList = () => {
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTimeZone('');
    setError('');
    setIsSearchFocused(true);
  };

  const handleClearSearch = () => {
    setSearch('');
    setTimeZone('');
    setError('');
    setIsSearchFocused(true);
    searchInputRef.current?.focus();
  };

  const handleLabelChange = (text: string) => {
    if (label.length > 0 && text.length === 0) {
      setLabelWasCleared(true);
    } else if (text.length > 0) {
      setLabelWasCleared(false);
    }
    setLabel(text);
    setError('');
  };

  const handleMembersChange = (text: string) => {
    setMembersInput(text);
    setError('');
  };

  const handleFieldFocus = () => {
    setIsSearchFocused(false);
  };

  const labelLimit = 25;
  const membersLimit = 50;
  const labelLength = label.length;
  const membersLength = membersInput.length;
  const isLabelTooLong = labelLength > labelLimit;
  const isMembersTooLong = membersLength > membersLimit;

  const handleSubmit = (insertAtStart = false) => {
    const trimmedLabel = label.trim();
    const trimmedTimeZone = normalizeTimeZoneId(timeZone.trim());
    if (!trimmedLabel || !trimmedTimeZone) {
      setError(t('errors.missingSelection'));
      return;
    }
    if (isLabelTooLong || isMembersTooLong) {
      if (isLabelTooLong && isMembersTooLong) {
        setError(t('errors.shortenLabelAndMembers'));
      } else if (isLabelTooLong) {
        setError(t('errors.shortenLabel'));
      } else {
        setError(t('errors.shortenMembers'));
      }
      return;
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: trimmedTimeZone }).format(new Date());
    } catch {
      setError(t('errors.invalidTimeZone'));
      return;
    }
    const members = membersInput
      .split(/[,\uFF0C\u3001\uFF64\uFE10\uFE50\uFE51\u060C]/)
      .map((m) => m.trim())
      .filter(Boolean);

    const submitAction = insertAtStart && !isEdit && onSubmitAtStart ? onSubmitAtStart : onSubmit;

    submitAction({
      label,
      timeZone: trimmedTimeZone,
      members: members.length ? members : undefined,
    });
    reset();
    onClose();
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  const handleSelectTz = (option: TimeZoneOption) => {
    const existingMatch = findExistingMatch(option);
    const isAutoEdit = !startedInEdit && mode === 'edit';
    const currentLabelKey = normalizeLabelValue(initialValue?.label ?? label);
    const optionKeys = getOptionLabelKeys(option);
    const isSameSelection =
      option.timeZoneId === timeZone && currentLabelKey && optionKeys.has(currentLabelKey);

    if (isAutoEdit) {
      if (isSameSelection) {
        setSearch(option.label);
        setError('');
        setIsSearchFocused(false);
        return;
      }
      skipResetOnClearRef.current = true;
      onReturnToAdd?.();
      setTimeZone(option.timeZoneId);
      setLabel(getCityLabel(option));
      setLabelWasCleared(false);
      setSearch(option.label);
      setError('');
      setIsSearchFocused(false);
      return;
    }

    if (existingMatch && !startedInEdit) {
      const normalized = normalizeTimeZoneId(existingMatch.zone.timeZone);
      setLabel(existingMatch.zone.label);
      setLabelWasCleared(false);
      setTimeZone(normalized);
      setMembersInput(existingMatch.zone.members?.join(', ') ?? '');
      setSearch(option.label);
      setError('');
      setIsSearchFocused(false);
      onSelectExisting?.(existingMatch.index);
      return;
    }

    setTimeZone(option.timeZoneId);
    setLabel(getCityLabel(option));
    setLabelWasCleared(false);
    setSearch(option.label);
    setError('');
    setIsSearchFocused(false);
  };

  return {
    label,
    membersInput,
    error,
    labelWasCleared,
    isEdit,
    labelLimit,
    membersLimit,
    labelLength,
    membersLength,
    isLabelTooLong,
    isMembersTooLong,
    handleSearchFocus,
    handleSearchChange,
    handleClearSearch,
    handleLabelChange,
    handleMembersChange,
    handleFieldFocus,
    handleSubmit,
    handleCancel,
    handleSelectTz,
    closeSearchList,
  };
}
