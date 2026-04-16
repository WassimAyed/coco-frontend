export interface ParticipantDto {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  registrationDate?: string;
  eventId: number;
  userId?: number;
}
