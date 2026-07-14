import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { teamService } from '../services/team.service';

export const teamController = {
  createTeam: asyncHandler(async (req: Request, res: Response) => {
    const team = await teamService.createTeam(req.body, req.user!.id);
    res.status(201).json({
      success: true,
      message: 'Team created successfully. You are the team leader.',
      data: team,
    });
  }),

  getTeamsByTrack: asyncHandler(async (req: Request, res: Response) => {
    const teams = await teamService.getTeamsByTrack(req.params.trackId);
    res.status(200).json({
      success: true,
      data: teams,
    });
  }),

  getTeamById: asyncHandler(async (req: Request, res: Response) => {
    const team = await teamService.getTeamById(req.params.id);
    res.status(200).json({
      success: true,
      data: team,
    });
  }),

  updateTeamStatus: asyncHandler(async (req: Request, res: Response) => {
    const team = await teamService.updateTeamStatus(
      req.params.id,
      req.body,
      req.user!.id
    );
    res.status(200).json({
      success: true,
      message: `Team status updated to ${req.body.status}.`,
      data: team,
    });
  }),

  addMember: asyncHandler(async (req: Request, res: Response) => {
    const member = await teamService.addMember(
      req.params.id,
      req.body.userId,
      req.user!.id
    );
    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully.',
      data: member,
    });
  }),

  removeMember: asyncHandler(async (req: Request, res: Response) => {
    const result = await teamService.removeMember(
      req.params.id,
      req.params.userId,
      req.user!.id
    );
    res.status(200).json({
      success: true,
      ...result,
    });
  }),

  getMyTeam: asyncHandler(async (req: Request, res: Response) => {
    const teams = await teamService.getMyTeam(req.user!.id);
    res.status(200).json({
      success: true,
      data: teams,
    });
  }),

  getMyInvitations: asyncHandler(async (req: Request, res: Response) => {
    const invitations = await teamService.getMyPendingInvitations(req.user!.id);
    res.status(200).json({
      success: true,
      data: invitations,
    });
  }),

  respondToInvitation: asyncHandler(async (req: Request, res: Response) => {
    const { action } = req.body;
    const invitation = await teamService.respondToInvitation(
      req.params.id,
      req.user!.id,
      action
    );
    res.status(200).json({
      success: true,
      message: `Invitation ${action.toLowerCase()}ed successfully.`,
      data: invitation,
    });
  }),

  cancelInvitation: asyncHandler(async (req: Request, res: Response) => {
    const result = await teamService.cancelInvitation(
      req.params.id,
      req.user!.id
    );
    res.status(200).json({
      success: true,
      ...result,
    });
  }),
};
