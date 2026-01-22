export interface AudioDuckingPlugin {
  duckVolume(options: { level: number }): Promise<{ success: boolean }>;
  restoreVolume(): Promise<{ success: boolean }>;
  isDucked(): Promise<{ isDucked: boolean }>;
}
