/**
 * Users API Routes
 * GET /api/users - List users
 * POST /api/users - Create user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { checkPermission } from '@/db/utils/permissions';
import { getUsers, createUser, getUserStats } from '@/db/utils/users';

// GET /api/users - List users with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const canRead = await checkPermission(session.user.id, 'users', 'read');
    if (!canRead) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const roleId = searchParams.get('roleId');
    const teamId = searchParams.get('teamId');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortBy = (searchParams.get('sortBy') as any) || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as any) || 'desc';

    // Get stats
    const getStats = searchParams.get('stats') === 'true';
    let stats;
    if (getStats) {
      stats = await getUserStats();
    }

    // Build filters
    const filters: any = {
      search,
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

    if (roleId) filters.roleId = parseInt(roleId);
    if (teamId) filters.teamId = parseInt(teamId);
    if (isActive !== null) filters.isActive = isActive === 'true';

    const result = await getUsers(filters);

    return NextResponse.json({
      success: true,
      ...result,
      stats,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const canCreate = await checkPermission(
      session.user.id,
      'users',
      'create',
      'all'
    );
    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.fullName || !body.email || !body.password || !body.roleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser({
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      roleId: body.roleId,
      teamId: body.teamId || null,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleId: user.roleId,
        teamId: user.teamId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    );
  }
}
