import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { ApiError } from '@/lib/api-client';

import { archiveTeamMember, createTeamMember, listTeam, updateTeamMember } from '../api';
import {
  AdminButton,
  Alert,
  Badge,
  ConfirmDialog,
  EmptyNotice,
  Field,
  ListSkeleton,
  Modal,
  PageHeader,
  Panel,
  TextArea,
  TextInput,
} from '../components/AdminUI';
import { MediaUploadField } from '../components/MediaUploadField';
import { useToast } from '../toast';
import type { AdminTeamMember, TeamInput } from '../types';

type TeamForm = {
  name: string;
  designation: string;
  bio: string;
  cloudId: string;
  published: boolean;
};
type Errors = Partial<Record<keyof TeamForm, string>>;

function TeamEditor({
  open,
  member,
  onClose,
  onSaved,
}: {
  open: boolean;
  member: AdminTeamMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<TeamForm>(() => ({
    name: member?.name ?? '',
    designation: member?.designation ?? '',
    bio: member?.bio ?? '',
    cloudId: member?.cloudId ?? '',
    published: Boolean(member?.publishedAt),
  }));
  const [errors, setErrors] = useState<Errors>({});
  const { push } = useToast();

  const save = useMutation({
    mutationFn: (input: TeamInput) =>
      member ? updateTeamMember(member.id, input) : createTeamMember(input),
    onSuccess: () => {
      push({ title: member ? 'Profile updated' : 'Profile created', tone: 'success' });
      onSaved();
      onClose();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.fields) setErrors(error.fields as Errors);
      push({
        title: 'The profile could not be saved',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};

    if (!form.name.trim()) next.name = 'A name is required.';
    if (!form.designation.trim()) next.designation = 'A role or designation is required.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    save.mutate({
      name: form.name.trim(),
      designation: form.designation.trim(),
      bio: form.bio.trim() || null,
      cloudId: form.cloudId.trim() || null,
      publishedAt: form.published ? new Date().toISOString() : null,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member ? `Edit ${member.name}` : 'New team member'}
      description="Only add qualifications and titles that the clinic has verified."
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" form="team-form" busy={save.isPending}>
            {member ? 'Save changes' : 'Create profile'}
          </AdminButton>
        </>
      }
    >
      <form id="team-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="team-name" required error={errors.name}>
            <TextInput
              id="team-name"
              autoFocus
              value={form.name}
              invalid={Boolean(errors.name)}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </Field>
          <Field
            label="Role / designation"
            htmlFor="team-designation"
            required
            hint="Use only the verified professional title."
            error={errors.designation}
          >
            <TextInput
              id="team-designation"
              value={form.designation}
              invalid={Boolean(errors.designation)}
              onChange={(event) =>
                setForm((current) => ({ ...current, designation: event.target.value }))
              }
            />
          </Field>
        </div>

        <Field
          label="Biography"
          htmlFor="team-bio"
          hint="Optional. Avoid unsupported medical claims (1200 characters)."
        >
          <TextArea
            id="team-bio"
            value={form.bio}
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
          />
        </Field>

        <MediaUploadField
          id="team-cloud"
          label="Profile image"
          folder="team"
          publicId={form.cloudId}
          alt={form.name}
          hint="Optional. Only publish photographs the practitioner has approved."
          onChange={(asset) =>
            setForm((current) => ({ ...current, cloudId: asset?.publicId ?? '' }))
          }
        />

        <label className="flex items-center gap-3 border border-brand-line bg-brand-ivory/60 p-4 text-sm text-brand-indigo">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) =>
              setForm((current) => ({ ...current, published: event.target.checked }))
            }
            className="size-4 accent-brand-indigo"
          />
          Publish this profile on the public team page
        </label>
      </form>
    </Modal>
  );
}

export function TeamPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTeamMember | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminTeamMember | null>(null);

  const team = useQuery({ queryKey: ['admin', 'team'], queryFn: listTeam });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const archive = useMutation({
    mutationFn: (id: string) => archiveTeamMember(id),
    onSuccess: () => {
      push({ title: 'Profile archived', tone: 'success' });
      setPendingDelete(null);
      invalidate();
    },
    onError: (error: unknown) =>
      push({
        title: 'The profile could not be archived',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const togglePublish = useMutation({
    mutationFn: (member: AdminTeamMember) =>
      updateTeamMember(member.id, {
        publishedAt: member.publishedAt ? null : new Date().toISOString(),
      }),
    onSuccess: (_data, member) => {
      push({
        title: member.publishedAt ? 'Profile unpublished' : 'Profile published',
        tone: 'success',
      });
      invalidate();
    },
    onError: (error: unknown) =>
      push({
        title: 'The publish state could not be changed',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const items = team.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Team"
        description="Practitioner profiles shown on the public team page. Publish only after names and credentials are verified."
        actions={
          <AdminButton
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus aria-hidden="true" size={15} /> New profile
          </AdminButton>
        }
      />

      <Alert tone="info">
        Do not add qualifications, registrations or medical titles that the clinic has not verified.
      </Alert>

      {team.isLoading ? (
        <ListSkeleton rows={3} />
      ) : team.isError ? (
        <Panel title="Team profiles could not be loaded">
          <p className="text-sm text-brand-muted">
            {team.error instanceof Error ? team.error.message : 'Unknown error.'}
          </p>
          <AdminButton variant="secondary" className="mt-4" onClick={() => void team.refetch()}>
            Try again
          </AdminButton>
        </Panel>
      ) : items.length === 0 ? (
        <EmptyNotice title="No team profiles yet">
          Add a profile once the practitioner has approved their name, role and biography.
        </EmptyNotice>
      ) : (
        <div className="overflow-x-auto border border-brand-line bg-brand-porcelain">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-brand-line bg-brand-ivory/70">
              <tr className="text-[0.5625rem] tracking-[0.18em] text-brand-muted uppercase">
                <th scope="col" className="px-4 py-3 font-medium">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Role
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {items.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-4">
                    <p className="font-medium text-brand-indigo">{member.name}</p>
                    {member.bio ? (
                      <p className="mt-1 max-w-md text-xs leading-5 text-brand-muted">
                        {member.bio}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-brand-muted">No biography yet</p>
                    )}
                    <p className="mt-1 font-mono text-[0.6875rem] text-brand-muted">
                      {member.cloudId ?? 'No profile image reference'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs text-brand-muted">{member.designation}</td>
                  <td className="px-4 py-4">
                    <Badge tone={member.publishedAt ? 'published' : 'draft'}>
                      {member.publishedAt ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <AdminButton
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditing(member);
                          setEditorOpen(true);
                        }}
                      >
                        <Pencil aria-hidden="true" size={13} /> Edit
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="ghost"
                        busy={togglePublish.isPending && togglePublish.variables?.id === member.id}
                        onClick={() => togglePublish.mutate(member)}
                      >
                        {member.publishedAt ? 'Unpublish' : 'Publish'}
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="danger"
                        onClick={() => setPendingDelete(member)}
                      >
                        <Trash2 aria-hidden="true" size={13} /> Archive
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editorOpen ? (
        <TeamEditor
          key={editing?.id ?? 'new'}
          open={editorOpen}
          member={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={invalidate}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Archive this profile?"
        message={`"${pendingDelete?.name ?? ''}" will be removed from the public team page.`}
        confirmLabel="Archive profile"
        busy={archive.isPending}
        onConfirm={() => pendingDelete && archive.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
