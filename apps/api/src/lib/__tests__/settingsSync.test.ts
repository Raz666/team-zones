import { describe, expect, test } from "vitest";
import {
  SETTINGS_MAX_BYTES,
  isVersionAccepted,
  selectRetentionDeletes,
  serializeSettings,
} from "../settingsSync";

describe("settings sync validation", () => {
  test("rejects non-monotonic versions", () => {
    expect(isVersionAccepted(null, 1)).toBe(true);
    expect(isVersionAccepted(1, 2)).toBe(true);
    expect(isVersionAccepted(2, 2)).toBe(false);
    expect(isVersionAccepted(2, 1)).toBe(false);
  });

  test("enforces settings size limit", () => {
    const payload = {
      value: "a".repeat(SETTINGS_MAX_BYTES),
    };

    expect(() => serializeSettings(payload)).toThrow("SETTINGS_TOO_LARGE");
  });

  test("selects older snapshots for soft delete", () => {
    const snapshots = Array.from({ length: 25 }, (_, index) => ({
      id: `snapshot-${25 - index}`,
    }));

    const deletions = selectRetentionDeletes(snapshots, 20);

    expect(deletions).toHaveLength(5);
    expect(deletions[0]).toBe("snapshot-5");
    expect(deletions[4]).toBe("snapshot-1");
  });
});
