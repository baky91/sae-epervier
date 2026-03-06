export type SocketMessage = {
  type: string;
  player_id: number | undefined;
  data: any;
};
