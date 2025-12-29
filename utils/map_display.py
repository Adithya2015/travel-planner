"""
Map display utilities for showing itinerary on an interactive map.
"""
import folium
from folium import IFrame
from typing import List, Dict, Any, Optional, Tuple
import base64


def create_itinerary_map(
    places: List[Dict[str, Any]],
    center: Optional[Tuple[float, float]] = None,
    zoom_start: int = 12
) -> folium.Map:
    """
    Create an interactive map showing itinerary places with markers and connections.

    Args:
        places: List of place dictionaries with keys:
            - name: Place name
            - latitude: Latitude coordinate
            - longitude: Longitude coordinate
            - description: Optional description
            - photo_url: Optional photo URL
            - day: Optional day number
            - time: Optional time of day (morning/afternoon/evening)
        center: Optional (lat, lng) tuple for map center. If None, calculated from places.
        zoom_start: Initial zoom level

    Returns:
        folium.Map object
    """
    if not places:
        # Return empty map centered on Paris as default
        return folium.Map(location=[48.8566, 2.3522], zoom_start=zoom_start)

    # Filter places with valid coordinates
    valid_places = [
        p for p in places
        if p.get('latitude') and p.get('longitude')
    ]

    if not valid_places:
        return folium.Map(location=[48.8566, 2.3522], zoom_start=zoom_start)

    # Calculate center if not provided
    if center is None:
        avg_lat = sum(p['latitude'] for p in valid_places) / len(valid_places)
        avg_lng = sum(p['longitude'] for p in valid_places) / len(valid_places)
        center = (avg_lat, avg_lng)

    # Create map
    m = folium.Map(
        location=center,
        zoom_start=zoom_start,
        tiles='cartodbpositron'
    )

    # Color palette for different days
    day_colors = [
        '#e74c3c',  # Day 1 - Red
        '#3498db',  # Day 2 - Blue
        '#2ecc71',  # Day 3 - Green
        '#9b59b6',  # Day 4 - Purple
        '#f39c12',  # Day 5 - Orange
        '#1abc9c',  # Day 6 - Teal
        '#e91e63',  # Day 7 - Pink
    ]

    # Time of day icons
    time_icons = {
        'morning': '🌅',
        'afternoon': '☀️',
        'evening': '🌙'
    }

    # Add markers for each place
    coordinates_for_line = []

    for i, place in enumerate(valid_places):
        lat = place['latitude']
        lng = place['longitude']
        name = place.get('name', f'Stop {i+1}')
        description = place.get('description', '')
        photo_url = place.get('photo_url')
        day = place.get('day', 1)
        time_of_day = place.get('time', '')

        coordinates_for_line.append([lat, lng])

        # Determine marker color based on day
        color = day_colors[(day - 1) % len(day_colors)]

        # Get time icon
        time_icon = time_icons.get(time_of_day.lower(), '📍') if time_of_day else '📍'

        # Create popup HTML with photo if available
        popup_html = _create_popup_html(
            name=name,
            description=description,
            photo_url=photo_url,
            day=day,
            time_of_day=time_of_day,
            time_icon=time_icon
        )

        # Create popup
        popup = folium.Popup(
            folium.Html(popup_html, script=True),
            max_width=300
        )

        # Add marker with custom icon
        folium.Marker(
            location=[lat, lng],
            popup=popup,
            tooltip=f"Day {day}: {name}",
            icon=folium.DivIcon(
                html=f'''
                    <div style="
                        background-color: {color};
                        color: white;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 12px;
                        border: 2px solid white;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    ">{i+1}</div>
                ''',
                icon_size=(30, 30),
                icon_anchor=(15, 15)
            )
        ).add_to(m)

    # Draw lines connecting places in order
    if len(coordinates_for_line) > 1:
        # Group by day for different colored lines
        current_day = valid_places[0].get('day', 1)
        day_coords = []

        for i, place in enumerate(valid_places):
            day = place.get('day', 1)
            coord = [place['latitude'], place['longitude']]

            if day != current_day and day_coords:
                # Draw line for previous day
                color = day_colors[(current_day - 1) % len(day_colors)]
                folium.PolyLine(
                    day_coords,
                    weight=3,
                    color=color,
                    opacity=0.7,
                    dash_array='10'
                ).add_to(m)
                day_coords = [day_coords[-1]]  # Start new day from last point
                current_day = day

            day_coords.append(coord)

        # Draw line for last day
        if day_coords:
            color = day_colors[(current_day - 1) % len(day_colors)]
            folium.PolyLine(
                day_coords,
                weight=3,
                color=color,
                opacity=0.7,
                dash_array='10'
            ).add_to(m)

    # Add legend
    legend_html = _create_legend_html(valid_places, day_colors)
    m.get_root().html.add_child(folium.Element(legend_html))

    # Fit bounds to show all markers
    if len(coordinates_for_line) > 1:
        m.fit_bounds(coordinates_for_line)

    return m


def _create_popup_html(
    name: str,
    description: str,
    photo_url: Optional[str],
    day: int,
    time_of_day: str,
    time_icon: str
) -> str:
    """Create HTML for marker popup."""

    photo_html = ""
    if photo_url:
        photo_html = f'''
            <img src="{photo_url}"
                 style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;"
                 onerror="this.style.display='none'"
            />
        '''

    time_html = ""
    if time_of_day:
        time_html = f'<span style="color: #666; font-size: 12px;">{time_icon} {time_of_day.capitalize()}</span>'

    description_html = ""
    if description:
        # Truncate long descriptions
        desc = description[:150] + "..." if len(description) > 150 else description
        description_html = f'<p style="margin: 8px 0; color: #444; font-size: 12px;">{desc}</p>'

    return f'''
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 200px;">
            {photo_html}
            <div style="padding: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="background: #3498db; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                        Day {day}
                    </span>
                    {time_html}
                </div>
                <h4 style="margin: 4px 0; color: #333; font-size: 14px;">{name}</h4>
                {description_html}
            </div>
        </div>
    '''


def _create_legend_html(places: List[Dict[str, Any]], day_colors: List[str]) -> str:
    """Create HTML for map legend."""

    # Get unique days
    days = sorted(set(p.get('day', 1) for p in places))

    legend_items = ""
    for day in days:
        color = day_colors[(day - 1) % len(day_colors)]
        legend_items += f'''
            <div style="display: flex; align-items: center; margin: 4px 0;">
                <div style="
                    background-color: {color};
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    margin-right: 8px;
                "></div>
                <span>Day {day}</span>
            </div>
        '''

    return f'''
        <div style="
            position: fixed;
            bottom: 30px;
            left: 30px;
            background: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
        ">
            <div style="font-weight: bold; margin-bottom: 8px;">Itinerary</div>
            {legend_items}
        </div>
    '''


def extract_places_from_plan(plan, places_client=None) -> List[Dict[str, Any]]:
    """
    Extract places with coordinates from a TravelPlan for map display.

    Args:
        plan: TravelPlan object
        places_client: Optional PlacesClient for fetching coordinates and photos

    Returns:
        List of place dictionaries with coordinates
    """
    places = []

    if not plan or not plan.itinerary:
        return places

    for day in plan.itinerary:
        day_num = day.day_number

        # Process morning activities
        for activity in day.morning:
            place = _extract_place_info(activity, day_num, 'morning', places_client)
            if place:
                places.append(place)

        # Process afternoon activities
        for activity in day.afternoon:
            place = _extract_place_info(activity, day_num, 'afternoon', places_client)
            if place:
                places.append(place)

        # Process evening activities
        for activity in day.evening:
            place = _extract_place_info(activity, day_num, 'evening', places_client)
            if place:
                places.append(place)

    return places


def _extract_place_info(
    activity,
    day: int,
    time_of_day: str,
    places_client=None
) -> Optional[Dict[str, Any]]:
    """Extract place info from an activity."""

    place = {
        'name': activity.name,
        'description': activity.description or '',
        'day': day,
        'time': time_of_day,
        'latitude': None,
        'longitude': None,
        'photo_url': None
    }

    # Try to get coordinates and photo from Google Places
    if places_client and activity.location:
        try:
            # Search for the place
            results = places_client.search_places(
                query=f"{activity.name} {activity.location}",
                place_type=None
            )

            if results:
                best_match = results[0]
                location = best_match.get('location', {})
                place['latitude'] = location.get('lat')
                place['longitude'] = location.get('lng')

                # Get photo if available
                place_id = best_match.get('place_id')
                if place_id:
                    photo_url = places_client.get_place_photo_url(place_id)
                    if photo_url:
                        place['photo_url'] = photo_url

        except Exception as e:
            print(f"Error fetching place info for {activity.name}: {e}")

    # Return None if no coordinates found
    if place['latitude'] is None or place['longitude'] is None:
        return None

    return place
