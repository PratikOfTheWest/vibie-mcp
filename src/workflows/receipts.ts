import type { EditReceipt } from "../bridge/types.js";

/**
 * Edit Receipt & Safety Manager
 * Mirrors the IDEAL pattern from leancoderkavy:
 * Ensures every timeline mutation returns a structured receipt with undo checkpoints.
 */
export class ReceiptManager {
  private static receipts: EditReceipt[] = [];

  public static createReceipt(
    command: string,
    details: Record<string, unknown>,
    summary: string,
    undoId?: number,
    dryRun = false
  ): EditReceipt {
    const receipt: EditReceipt = {
      command,
      timestamp: new Date().toISOString(),
      undoId,
      status: dryRun ? "dry_run" : "success",
      details,
      summary,
    };
    this.receipts.push(receipt);
    return receipt;
  }

  public static getHistory(): EditReceipt[] {
    return [...this.receipts];
  }

  public static getLastReceipt(): EditReceipt | null {
    return this.receipts.length > 0 ? this.receipts[this.receipts.length - 1] : null;
  }
}
