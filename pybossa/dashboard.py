# -*- coding: utf8 -*-
# This file is part of PyBossa.
#
# Copyright (C) 2015 SF Isle of Man Limited
#
# PyBossa is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# PyBossa is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with PyBossa.  If not, see <http://www.gnu.org/licenses/>.
"""Dashboard Jobs module for running background tasks in PyBossa server."""
from sqlalchemy import text
from pybossa.core import db

MINUTE = 60

def get_dashboard_jobs(): # pragma: no cover
    """Return dashboard jobs."""
    yield dict(name=dashboard_active_users_week, args=[], kwargs={},
               timeout=(10 * MINUTE), queue='low')
    yield dict(name=dashboard_active_anon_week, args=[], kwargs={},
               timeout=(10 * MINUTE), queue='low')
    yield dict(name=dashboard_new_projects_week, args=[], kwargs={},
               timeout=(10 * MINUTE), queue='low')


def dashboard_active_users_week():
    """Get active users last week."""
    # Check first if the materialized view exists
    sql = text('''SELECT EXISTS (SELECT relname FROM pg_class WHERE
               relname='dashboard_week_users');''')
    results = db.slave_session.execute(sql)
    for row in results:
        if row.exists:
            sql = text('''REFRESH MATERIALIZED VIEW
                       dashboard_week_users''')
            db.session.execute(sql)
            return "Materialized view refreshed"
        else:
            sql = text('''CREATE MATERIALIZED VIEW dashboard_week_users AS
                       WITH crafters_per_day AS
                            (select to_date(task_run.finish_time,
                                            'YYYY-MM-DD\THH24:MI:SS.US') AS day,
                                    user_id, COUNT(task_run.user_id) AS day_crafters
                            FROM task_run
                            WHERE to_date(task_run.finish_time,
                                          'YYYY-MM-DD\THH24:MI:SS.US')
                                >= NOW() - ('1 week'):: INTERVAL
                            GROUP BY day, task_run.user_id)
                       SELECT day, COUNT(crafters_per_day.user_id) AS n_users
                       FROM crafters_per_day GROUP BY day ORDER BY day;''')
            results = db.slave_session.execute(sql)
            db.session.commit()
            return "Materialized view created"


def dashboard_active_anon_week():
    """Get active anon last week."""
    # Check first if the materialized view exists
    sql = text('''SELECT EXISTS (SELECT relname FROM pg_class WHERE
               relname='dashboard_week_anon');''')
    results = db.slave_session.execute(sql)
    for row in results:
        if row.exists:
            sql = text('''REFRESH MATERIALIZED VIEW
                       dashboard_week_anon''')
            db.session.execute(sql)
            return "Materialized view refreshed"
        else:
            sql = text('''CREATE MATERIALIZED VIEW dashboard_week_anon AS
                       WITH crafters_per_day AS
                            (select to_date(task_run.finish_time,
                                            'YYYY-MM-DD\THH24:MI:SS.US') AS day,
                                    user_ip, COUNT(task_run.user_ip) AS day_crafters
                            FROM task_run
                            WHERE to_date(task_run.finish_time,
                                          'YYYY-MM-DD\THH24:MI:SS.US')
                                >= NOW() - ('1 week'):: INTERVAL
                            GROUP BY day, task_run.user_ip)
                       SELECT day, COUNT(crafters_per_day.user_ip) AS n_users
                       FROM crafters_per_day GROUP BY day ORDER BY day;''')
            results = db.slave_session.execute(sql)
            db.session.commit()
            return "Materialized view created"

def dashboard_new_projects_week():
    """Get new created projects last week."""
    # Check first if the materialized view exists
    sql = text('''SELECT EXISTS (SELECT relname FROM pg_class WHERE
               relname='dashboard_week_project_new');''')
    results = db.slave_session.execute(sql)
    for row in results:
        if row.exists:
            sql = text('''REFRESH MATERIALIZED VIEW
                       dashboard_week_project_new''')
            db.session.execute(sql)
            return "Materialized view refreshed"
        else:
            sql = text('''CREATE MATERIALIZED VIEW dashboard_week_project_new AS
                       SELECT TO_DATE(project.created, 'YYYY-MM-DD\THH24:MI:SS.US') as day,
                       project.id, short_name, project.name,
                       owner_id, "user".name as u_name, "user".email_addr
                       FROM project, "user"
                       WHERE TO_DATE(project.created,
                                    'YYYY-MM-DD\THH24:MI:SS.US') >= now() -
                                    ('1 week')::INTERVAL
                       AND "user".id=project.owner_id
                       GROUP BY project.id, "user".name, "user".email_addr;''')
            results = db.slave_session.execute(sql)
            db.session.commit()
            return "Materialized view created"
