#!/usr/bin/env python3
"""Player MPRIS falso para o harness (specs/05-musica.md): toca uma faixa e
troca de faixa em Next(). Rode no D-Bus privado do Hyprland aninhado:

    DBUS_SESSION_BUS_ADDRESS="$(cat dist/bus)" python3 dev/fake-mpris.py
"""

import gi

gi.require_version("Gio", "2.0")
from gi.repository import Gio, GLib  # noqa: E402

BUS_NAME = "org.mpris.MediaPlayer2.IslandFake"
PATH = "/org/mpris/MediaPlayer2"
PLAYER = "org.mpris.MediaPlayer2.Player"

XML = """
<node>
  <interface name="org.mpris.MediaPlayer2">
    <property name="Identity" type="s" access="read"/>
    <property name="CanQuit" type="b" access="read"/>
    <property name="CanRaise" type="b" access="read"/>
  </interface>
  <interface name="org.mpris.MediaPlayer2.Player">
    <method name="Next"/>
    <method name="Previous"/>
    <method name="PlayPause"/>
    <property name="PlaybackStatus" type="s" access="read"/>
    <property name="Metadata" type="a{sv}" access="read"/>
    <property name="Position" type="x" access="read"/>
    <property name="CanGoNext" type="b" access="read"/>
    <property name="CanGoPrevious" type="b" access="read"/>
    <property name="CanPlay" type="b" access="read"/>
    <property name="CanPause" type="b" access="read"/>
    <property name="CanControl" type="b" access="read"/>
    <property name="CanSeek" type="b" access="read"/>
  </interface>
</node>
"""

TRACKS = [
    ("Daft Punk", "Instant Crush", 337),
    ("Caetano Veloso", "Leãozinho", 182),
]


class FakePlayer:
    def __init__(self):
        self.index = 0
        self.playing = True
        self.started = GLib.get_monotonic_time()
        self.connection = None

    def metadata(self):
        artist, title, seconds = TRACKS[self.index]
        return {
            "mpris:trackid": GLib.Variant("o", f"/island/track/{self.index}"),
            "xesam:title": GLib.Variant("s", title),
            "xesam:artist": GLib.Variant("as", [artist]),
            "mpris:length": GLib.Variant("x", seconds * 1_000_000),
        }

    def position(self):
        return 42_000_000 + (GLib.get_monotonic_time() - self.started)

    def get_property(self, _conn, _sender, _path, interface, name):
        values = {
            "Identity": GLib.Variant("s", "Spotify"),
            "CanQuit": GLib.Variant("b", False),
            "CanRaise": GLib.Variant("b", False),
            "PlaybackStatus": GLib.Variant("s", "Playing" if self.playing else "Paused"),
            "Metadata": GLib.Variant("a{sv}", self.metadata()),
            "Position": GLib.Variant("x", self.position()),
            "CanGoNext": GLib.Variant("b", True),
            "CanGoPrevious": GLib.Variant("b", True),
            "CanPlay": GLib.Variant("b", True),
            "CanPause": GLib.Variant("b", True),
            "CanControl": GLib.Variant("b", True),
            "CanSeek": GLib.Variant("b", False),
        }
        return values.get(name)

    def call(self, _conn, _sender, _path, _interface, method, _params, invocation):
        if method == "Next":
            self.index = (self.index + 1) % len(TRACKS)
            self.started = GLib.get_monotonic_time()
        elif method == "PlayPause":
            self.playing = not self.playing
        self.changed()
        invocation.return_value(None)

    def changed(self):
        props = {
            "PlaybackStatus": GLib.Variant("s", "Playing" if self.playing else "Paused"),
            "Metadata": GLib.Variant("a{sv}", self.metadata()),
        }
        self.connection.emit_signal(
            None,
            PATH,
            "org.freedesktop.DBus.Properties",
            "PropertiesChanged",
            GLib.Variant("(sa{sv}as)", (PLAYER, props, [])),
        )

    def on_bus(self, connection, _name):
        self.connection = connection
        for interface in Gio.DBusNodeInfo.new_for_xml(XML).interfaces:
            connection.register_object(PATH, interface, self.call, self.get_property, None)


def main():
    player = FakePlayer()
    Gio.bus_own_name(Gio.BusType.SESSION, BUS_NAME, 0, player.on_bus, None, None)
    # SIGUSR1 = Next(), para o teste trocar de faixa sem cliente D-Bus.
    GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, 10, lambda: player.call(None, None, None, None, "Next", None, _Ignore()) or True)
    GLib.MainLoop().run()


class _Ignore:
    def return_value(self, _value):
        pass


if __name__ == "__main__":
    main()
