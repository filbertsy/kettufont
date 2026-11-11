-- =========================================================
-- OVERKILL V4 | ROBLOX BEDWARS
-- =========================================================
-- FILL: Requires Delta/Fluxus/Synapse with `Drawing`, `writefile`, `hookfunction`, `getconnections`.
-- If any specific capability is missing, the script degrades gracefully.
-- WARNING: Load in a fresh server. Some features are intrusive.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local VirtualUser = game:GetService("VirtualUser")
local VirtualInputManager = game:GetService("VirtualInputManager")
local TweenService = game:GetService("TweenService")
local LocalPlayer = Players.LocalPlayer

-- =========================================================
-- CAPABILITY DETECTION
-- =========================================================
local Capabilities = {
    Drawing = pcall(function() local d = Drawing.new("Text"); d:Remove() end),
    FileSystem = pcall(function() writefile("ovk_test.txt", "t"); isfile("ovk_test.txt"); makefolder("overkill_profiles") end),
    Hook = pcall(function() hookfunction(print, print) end),
    Connections = pcall(function() getconnections(RunService.Heartbeat) end),
    Queue = pcall(function() task.queue_on_teleport("print('test')") end),
    Metatable = pcall(function() getrawmetatable(game) end)
}

-- =========================================================
-- THEME & CONSTANTS
-- =========================================================
local Theme = {
    Bg = Color3.fromRGB(10, 10, 12),
    Panel = Color3.fromRGB(18, 18, 22),
    Accent = Color3.fromRGB(110, 140, 255),
    Text = Color3.fromRGB(230, 230, 235),
    Sub = Color3.fromRGB(130, 130, 140),
    Stroke = Color3.fromRGB(40, 40, 45),
    Danger = Color3.fromRGB(255, 70, 70),
    Success = Color3.fromRGB(70, 255, 120)
}

local Config = {
    Theme = "Default",
    AutoSave = true,
    LastProfile = "default"
}

-- =========================================================
-- STATE
-- =========================================================
local State = {
    Char = nil,
    Hum = nil,
    Root = nil,
    FlyBV = nil,
    LastJump = 0,
    LastPos = Vector3.zero,
    LastT = tick(),
    DisablerActive = false,
    Target = nil,
    DebugMode = false
}

-- =========================================================
-- UTILITIES
-- =========================================================
local function W2S(pos)
    local cam = Workspace.CurrentCamera
    if not cam then return Vector2.zero, false end
    local p, on = cam:WorldToViewportPoint(pos)
    return Vector2.new(p.X, p.Y), on and p.Z > 0
end

local function SafeCall(fn, ...)
    local success, result = pcall(fn, ...)
    if not success and State.DebugMode then warn("[OVERKILL] " .. tostring(result)) end
    return success, result
end

local function GetNearestPlayer(maxDist)
    local best, dist = nil, maxDist or 500
    if not State.Root then return nil end
    for _, p in pairs(Players:GetPlayers()) do
        if p ~= LocalPlayer and p.Character and p.Character:FindFirstChild("HumanoidRootPart") then
            local d = (p.Character.HumanoidRootPart.Position - State.Root.Position).Magnitude
            if d < dist then best, dist = p, d end
        end
    end
    return best, dist
end

-- =========================================================
-- CHARACTER HOOK
-- =========================================================
local function UpdateChar()
    State.Char = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
    State.Hum = State.Char:WaitForChild("Humanoid")
    State.Root = State.Char:WaitForChild("HumanoidRootPart")
end
UpdateChar()
LocalPlayer.CharacterAdded:Connect(UpdateChar)

-- =========================================================
-- CORE DISABLER
-- =========================================================
local Disabler = {}
local DisablerConns = {}
local ACKeywords = {"ac","anticheat","detect","guard","shield","secure","monitor","kick","ban","punish","check","scan","vape","overkill"}

local function IsACName(name)
    local n = name:lower()
    for _, kw in ipairs(ACKeywords) do
        if string.find(n, kw) then return true end
    end
    return false
end

function Disabler.PurgeScripts(container)
    if not container then return end
    for _, obj in ipairs(container:GetDescendants()) do
        if (obj:IsA("LocalScript") or obj:IsA("Script")) and IsACName(obj.Name) then
            SafeCall(function() obj:Destroy() end)
        end
    end
end

function Disabler.SetupFirewall()
    table.insert(DisablerConns, task.spawn(function()
        local counts = {}
        while State.DisablerActive do
            SafeCall(function()
                for _, folder in ipairs({ReplicatedStorage, Workspace}) do
                    for _, r in ipairs(folder:GetDescendants()) do
                        if r:IsA("RemoteEvent") or r:IsA("UnreliableRemoteEvent") then
                            if not counts[r] then
                                counts[r] = 0
                                table.insert(DisablerConns, r.OnClientEvent:Connect(function() 
                                    counts[r] = (counts[r] or 0) + 1 
                                end))
                            end
                            if counts[r] > 20 then
                                SafeCall(function() r:Destroy() end)
                                counts[r] = nil
                            end
                        end
                    end
                end
            end)
            task.wait(1)
        end
    end))
end

function Disabler.SetupSpoofing()
    local lastY = 0
    table.insert(DisablerConns, RunService.Stepped:Connect(function()
        if not State.DisablerActive or not State.Root or not State.Hum then return end
        local p, t = State.Root.Position, tick()
        
        -- Horizontal speed spoof
        local horizontalDist = (Vector3.new(p.X, 0, p.Z) - Vector3.new(State.LastPos.X, 0, State.LastPos.Z)).Magnitude
        if horizontalDist / math.max(t - State.LastT, 0.001) > 100 then
            State.Root.Velocity = State.Root.Velocity * 0.05
        end
        
        -- Vertical speed spoof
        local delta = p.Y - lastY
        if delta > 5 and State.Hum.FloorMaterial == Enum.Material.Air then
            local v = State.Root.Velocity
            State.Root.Velocity = Vector3.new(v.X, math.min(v.Y, 0), v.Z)
        end
        
        State.LastPos = p
        State.LastT = t
        lastY = p.Y
    end))
end

function Disabler.SetupHooks()
    if not Capabilities.Hook then return end
    SafeCall(function()
        local oldCS = State.Hum.ChangeState
        hookfunction(State.Hum.ChangeState, function(self, state)
            if State.DisablerActive and state == Enum.HumanoidStateType.Jumping and self.FloorMaterial == Enum.Material.Air then
                return
            end
            return oldCS(self, state)
        end)
    end)
end

function Disabler.Enable()
    if State.DisablerActive then return end
    State.DisablerActive = true
    
    Disabler.PurgeScripts(LocalPlayer.PlayerScripts)
    Disabler.SetupFirewall()
    Disabler.SetupSpoofing()
    Disabler.SetupHooks()
    
    table.insert(DisablerConns, Workspace.ChildAdded:Connect(function(c)
        if State.DisablerActive and IsACName(c.Name) then SafeCall(function() c:Destroy() end) end
    end))
    
    table.insert(DisablerConns, task.spawn(function()
        while State.DisablerActive do
            SafeCall(function()
                for _, obj in ipairs(Workspace:GetDescendants()) do
                    if (obj:IsA("Script") or obj:IsA("LocalScript")) and IsACName(obj.Name) then
                        SafeCall(function() obj:Destroy() end)
                    end
                end
            end)
            task.wait(0.5)
        end
    end))
end

function Disabler.Disable()
    State.DisablerActive = false
    for _, c in ipairs(DisablerConns) do SafeCall(function() c:Disconnect() end) end
    table.clear(DisablerConns)
end

-- =========================================================
-- PROFILES
-- =========================================================
local ProfileManager = {
    Dir = "overkill_profiles",
    Presets = {
        ["Closet Cheat"] = {
            Sprint = true, Reach = true, NoFall = true, NameTags = true, DistanceTags = true,
            AntiAFK = true, Disabler = true, AutoSprint = true, NoSlowdown = true, Strafing = true
        },
        ["Rage"] = {
            Sprint = true, Speed = true, JumpPower = true, InfiniteJump = true, Fly = true,
            NoClip = true, HitBoxes = true, Killaura = true, Reach = true, AutoClicker = true,
            NoFall = true, ESP = true, BoxESP = true, NameTags = true, HealthBars = true,
            Tracers = true, AntiAFK = true, Disabler = true, SpinBot = true, BedAura = true
        },
        ["Legit"] = {
            Sprint = true, NoFall = true, AntiAFK = true, Disabler = true, AutoSprint = true
        }
    }
}

function ProfileManager.EnsureDir()
    if not Capabilities.FileSystem then return end
    SafeCall(function()
        if not isfolder(ProfileManager.Dir) then makefolder(ProfileManager.Dir) end
    end)
end

function ProfileManager.Save(name)
    if not Capabilities.FileSystem then return end
    ProfileManager.EnsureDir()
    local data = {}
    for k, v in pairs(Config) do if type(v) == "boolean" then data[k] = v end end
    SafeCall(function()
        writefile(ProfileManager.Dir .. "/" .. name .. ".json", HttpService:JSONEncode(data))
    end)
    Config.LastProfile = name
end

function ProfileManager.Load(name)
    if not Capabilities.FileSystem then return end
    local path = ProfileManager.Dir .. "/" .. name .. ".json"
    if not isfile(path) then return end
    SafeCall(function()
        local data = HttpService:JSONDecode(readfile(path))
        for k, v in pairs(data) do if type(v) == "boolean" then Config[k] = v end end
        Config.LastProfile = name
    end)
end

function ProfileManager.ApplyPreset(name)
    local preset = ProfileManager.Presets[name]
    if not preset then return end
    for k, v in pairs(preset) do Config[k] = v end
    Config.LastProfile = name
end

ProfileManager.EnsureDir()

-- =========================================================
-- FEATURE DEFINITIONS (Hundreds mapped)
-- =========================================================
local Categories = {
    Combat = {
        "Sprint","Speed","JumpPower","InfiniteJump","Fly","NoClip","HitBoxes","Killaura","Reach",
        "AutoClicker","NoFall","AutoParry","SilentAim","AimAssist","TriggerBot","AutoShoot",
        "FastFire","BunnyHop","AirStrafe","AntiKnockback","AutoSprint","NoSlowdown","Wtap",
        "Strafing","SwordBlock","AutoTool","SmartAim","Criticals","ReachExtend","FastSwing",
        "AutoBlock","AutoSword","SwordBlock","TargetStrafe","CircleStrafe","Wtap","Strafing"
    },
    Blatant = {
        "Invisible","SpinBot","ProjectileAura","DamageBoost","AutoConsume","PickupRange",
        "ChestSteal","FastBreak","Breaker","Velocity","NoSlow","Timer","Gravity","AutoBed",
        "AutoShop","AutoBuy","GodMode","NoclipAll","InstantBreak","AutoBuild","FastPlace",
        "Scaffold","GenPlace","BedAura","BedBreak","BedDefend","TrapSteal","InfiniteEat",
        "InstantRespawn","AutoQueue","ChatSpam","InventorySteal","AutoArmor","AutoSwordBest"
    },
    Render = {
        "ESP","BoxESP","NameTags","HealthBars","Tracers","Chams","Xray","FullBright","Arrows",
        "HeadDot","ItemESP","ChestESP","BedESP","DistanceTags","TeamCheck","ViewModelESP",
        "DamageNumbers","ProjectileTracers","PlayerList","Ping","FPS","Memory","ServerInfo",
        "Coordinate","VelocityESP","DirectionESP","HitTracers","HitBoxesESP","KillFeed","ScoreBoard"
    },
    World = {
        "AntiAFK","Freecam","Parkour","SafeWalk","StreamRemover","AntiFling","AntiVoid",
        "AutoRejoin","ServerHop","Panic","Disguise","FakeLag","InstantRespawn","GodSpeed",
        "NoJumpCooldown","BypassVoid","TpToPlayer","TpToChest","TpToGen","TpToBed","TpToSpawn",
        "TpToShop","TpToBase","TpToVoid","AutoClimb","AutoJump","AutoSprint","AutoStrafe",
        "InstantFall","NoGravity","NoWater","SwimSpeed","LadderSpeed","WebSpeed","NoWeb",
        "LavaWalk","WaterWalk","VoidWalk","FireWalk","SpikeWalk","SnowWalk","IceWalk","SlimeWalk"
    },
    Utility = {
        "Disabler","FPSBoost","AutoGG","StaffDetector","FOVChanger","CustomCrosshair",
        "GhostMode","SaveProfile","LoadProfile","ListProfiles","PresetCloset","PresetRage",
        "PresetLegit","AutoVote","DiscordRPC","Zoom","AntiDetect","AntiKick","AntiBan",
        "Console","Logger","DebugMode","Profiler","Stats","MemoryUsage","CPUUsage",
        "PacketLog","RemoteLog","PropertyLog","InstanceLog","CharacterLog","PlayerLog",
        "ChatLog","CommandLog","ScriptLog","FunctionLog","HookLog","SignalLog","ServiceLog"
    }
}

-- Initialize all toggles to false
for _, cat in pairs(Categories) do
    for _, feat in ipairs(cat) do
        if Config[feat] == nil then Config[feat] = false end
    end
end

-- =========================================================
-- UI ENGINE
-- =========================================================
local UI = {
    Tabs = {},
    ActiveTab = "Combat",
    Open = true,
    Scroll = {},
    MaxRows = 16,
    Elements = {},
    Dragging = false,
    DragStart = nil,
    Offset = Vector2.new(0, 0),
    Pos = Vector2.new(0, 0)
}

local ScreenW, ScreenH = 0, 0
local function UpdateScreen()
    local cam = Workspace.CurrentCamera
    if cam then ScreenW, ScreenH = cam.ViewportSize.X, cam.ViewportSize.Y end
end
UpdateScreen()

local function NewDrawing(class, props)
    if not Capabilities.Drawing then return nil end
    local o = Drawing.new(class)
    for k, v in pairs(props or {}) do o[k] = v end
    return o
end

local Drawings = {}
local function Track(o) if o then table.insert(Drawings, o) end return o end

-- Base UI
local Bg = Track(NewDrawing("Square", { Color = Theme.Bg, Thickness = 1, Filled = true, Size = Vector2.new(660, 500) }))
local Outline = Track(NewDrawing("Square", { Color = Theme.Stroke, Thickness = 1, Filled = false, Size = Vector2.new(660, 500) }))
local Sidebar = Track(NewDrawing("Square", { Color = Theme.Panel, Thickness = 1, Filled = true, Size = Vector2.new(160, 500) }))
local Logo = Track(NewDrawing("Text", { Text = "OVERKILL", Color = Theme.Accent, Size = 22, Font = 3 }))
local SubLabel = Track(NewDrawing("Text", { Text = "V4", Color = Theme.Sub, Size = 14, Font = 2 }))
local ProfileLabel = Track(NewDrawing("Text", { Text = "Profile: default", Color = Theme.Sub, Size = 12, Font = 1 }))

-- Tabs
for i, name in ipairs({"Combat", "Blatant", "Render", "World", "Utility"}) do
    local btn = Track(NewDrawing("Text", { Text = "  " .. name, Color = Theme.Sub, Size = 15, Font = 2 }))
    local bg = Track(NewDrawing("Square", { Color = Theme.Accent, Thickness = 1, Filled = true, Size = Vector2.new(160, 28), Transparency = 0.85 }))
    UI.Tabs[name] = { Text = btn, Bg = bg, Index = i }
end

-- Elements
for catName, feats in pairs(Categories) do
    for i, feat in ipairs(feats) do
        local lbl = Track(NewDrawing("Text", { Text = feat, Color = Theme.Text, Size = 14, Font = 1, Visible = false }))
        local box = Track(NewDrawing("Square", { Color = Theme.Sub, Thickness = 1, Filled = true, Size = Vector2.new(16, 16), Visible = false }))
        local acc = Track(NewDrawing("Square", { Color = Theme.Accent, Thickness = 1, Filled = true, Size = Vector2.new(10, 10), Visible = false }))
        UI.Elements[feat] = { Label = lbl, Box = box, Acc = acc, Row = i, Cat = catName }
    end
end

local function LayoutUI()
    UpdateScreen()
    UI.Pos = UI.Pos == Vector2.new(0, 0) and Vector2.new(ScreenW/2 - 330, ScreenH/2 - 250) or UI.Pos
    local x, y = UI.Pos.X, UI.Pos.Y
    local open = UI.Open

    Bg.Visible = open; Bg.Position = Vector2.new(x, y)
    Outline.Visible = open; Outline.Position = Vector2.new(x, y)
    Sidebar.Visible = open; Sidebar.Position = Vector2.new(x, y)
    Logo.Visible = open; Logo.Position = Vector2.new(x + 15, y + 12)
    SubLabel.Visible = open; SubLabel.Position = Vector2.new(x + 128, y + 18)
    ProfileLabel.Visible = open; ProfileLabel.Position = Vector2.new(x + 15, y + 40)
    ProfileLabel.Text = "Profile: " .. Config.LastProfile

    for name, t in pairs(UI.Tabs) do
        local ty = y + 70 + (t.Index - 1) * 34
        t.Text.Visible = open; t.Text.Position = Vector2.new(x + 10, ty)
        t.Bg.Visible = open and (name == UI.ActiveTab); t.Bg.Position = Vector2.new(x, ty - 5)
        t.Text.Color = (name == UI.ActiveTab) and Color3.new(1, 1, 1) or Theme.Sub
    end

    local cat = Categories[UI.ActiveTab]
    if cat then
        local scroll = UI.Scroll[UI.ActiveTab] or 0
        local cx = x + 180
        for i, feat in ipairs(cat) do
            local t = UI.Elements[feat]
            if i > scroll and i <= scroll + UI.MaxRows then
                local ty = y + 20 + ((i - scroll - 1) * 26)
                t.Label.Visible = open; t.Label.Position = Vector2.new(cx, ty)
                t.Box.Visible = open; t.Box.Position = Vector2.new(cx + 440, ty + 3)
                t.Acc.Visible = open and Config[feat]; t.Acc.Position = Vector2.new(cx + 444, ty + 7)
                t.Box.Color = Config[feat] and Theme.Accent or Theme.Sub
                
                if feat:match("^Save") or feat:match("^Load") or feat:match("^List") or feat:match("^Preset") then
                    t.Box.Visible = false; t.Acc.Visible = false
                    t.Label.Text = "[" .. feat .. "]"; t.Label.Color = Theme.Accent
                else
                    t.Label.Text = feat; t.Label.Color = Theme.Text
                end
            else
                t.Label.Visible = false; t.Box.Visible = false; t.Acc.Visible = false
            end
        end
    end
end

-- =========================================================
-- INPUT HANDLER
-- =========================================================
local touchStart = nil
local function HandleInput(pos)
    local x, y = UI.Pos.X, UI.Pos.Y
    
    -- Tab switch
    for name, t in pairs(UI.Tabs) do
        local ty = y + 70 + (t.Index - 1) * 34
        if pos.X >= x and pos.X <= x + 160 and pos.Y >= ty - 5 and pos.Y <= ty + 23 then
            UI.ActiveTab = name
            LayoutUI()
            return
        end
    end
    
    -- Toggle click
    local cat = Categories[UI.ActiveTab]
    if cat then
        local scroll = UI.Scroll[UI.ActiveTab] or 0
        local cx = x + 180
        for i, feat in ipairs(cat) do
            if i > scroll and i <= scroll + UI.MaxRows then
                local ty = y + 20 + ((i - scroll - 1) * 26)
                if pos.X >= cx + 440 and pos.X <= cx + 460 and pos.Y >= ty and pos.Y <= ty + 22 then
                    if feat == "SaveProfile" then ProfileManager.Save(Config.LastProfile == "default" and "custom_" .. os.time() or Config.LastProfile)
                    elseif feat == "LoadProfile" then ProfileManager.Load(Config.LastProfile)
                    elseif feat == "ListProfiles" then
                        local list = {}
                        SafeCall(function() for _, f in ipairs(listfiles(ProfileManager.Dir)) do table.insert(list, f:match("([^/\\]+)%.json$")) end end)
                        print("[OVERKILL] Profiles: " .. table.concat(list, ", "))
                    elseif feat == "PresetCloset" then ProfileManager.ApplyPreset("Closet Cheat")
                    elseif feat == "PresetRage" then ProfileManager.ApplyPreset("Rage")
                    elseif feat == "PresetLegit" then ProfileManager.ApplyPreset("Legit")
                    else
                        Config[feat] = not Config[feat]
                        if feat == "Disabler" then
                            if Config[feat] then Disabler.Enable() else Disabler.Disable() end
                        end
                    end
                    LayoutUI()
                    return
                end
            end
        end
    end
end

UserInputService.InputBegan:Connect(function(input, gpe)
    if gpe then return end
    if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseButton1 then
        local pos = input.Position
        -- Drag UI
        if pos.X >= UI.Pos.X and pos.X <= UI.Pos.X + 660 and pos.Y >= UI.Pos.Y and pos.Y <= UI.Pos.Y + 20 then
            UI.Dragging = true
            UI.DragStart = pos
            UI.Offset = UI.Pos
            return
        end
        HandleInput(pos)
        touchStart = pos
    end
    if input.KeyCode == Enum.KeyCode.RightShift then
        UI.Open = not UI.Open
        LayoutUI()
    end
end)

UserInputService.InputChanged:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseMovement then
        if UI.Dragging and UI.DragStart then
            local delta = input.Position - UI.DragStart
            UI.Pos = UI.Offset + delta
            LayoutUI()
        elseif touchStart then
            local dy = input.Position.Y - touchStart.Y
            if math.abs(dy) > 15 then
                local cat = Categories[UI.ActiveTab]
                if cat then
                    local s = UI.Scroll[UI.ActiveTab] or 0
                    UI.Scroll[UI.ActiveTab] = math.clamp(s - math.sign(dy), 0, math.max(0, #cat - UI.MaxRows))
                    LayoutUI()
                end
                touchStart = nil
            end
        end
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseButton1 then
        UI.Dragging = false
        UI.DragStart = nil
        touchStart = nil
    end
end)

UserInputService.MouseWheelInput:Connect(function(dir)
    local cat = Categories[UI.ActiveTab]; if not cat then return end
    local s = UI.Scroll[UI.ActiveTab] or 0
    UI.Scroll[UI.ActiveTab] = math.clamp(s - dir, 0, math.max(0, #cat - UI.MaxRows))
    LayoutUI()
end)

-- =========================================================
-- ESP ENGINE
-- =========================================================
local ESPCache = {}
local function GetESP(p)
    if p == LocalPlayer then return nil end
    if not ESPCache[p] then
        ESPCache[p] = {
            Box = NewDrawing("Square", { Color = Color3.fromRGB(255, 60, 60), Thickness = 1, Filled = false, Visible = false }),
            Fill = NewDrawing("Square", { Color = Color3.fromRGB(255, 60, 60), Thickness = 1, Filled = true, Transparency = 0.9, Visible = false }),
            Name = NewDrawing("Text", { Color = Color3.new(1, 1, 1), Size = 13, Font = 2, Visible = false }),
            Health = NewDrawing("Square", { Color = Color3.fromRGB(0, 255, 100), Thickness = 1, Filled = true, Visible = false }),
            Tracer = NewDrawing("Line", { Color = Color3.new(1, 1, 1), Thickness = 1, Transparency = 0.5, Visible = false }),
            Dot = NewDrawing("Circle", { Color = Color3.new(1, 1, 1), Thickness = 1, Filled = true, Radius = 3, Visible = false }),
            Dist = NewDrawing("Text", { Color = Color3.fromRGB(200, 200, 200), Size = 12, Font = 1, Visible = false })
        }
    end
    return ESPCache[p]
end

local function UpdateESP()
    local cam = Workspace.CurrentCamera
    if not cam then return end
    local camPos = cam.CFrame.Position
    
    for _, p in pairs(Players:GetPlayers()) do
        local c = GetESP(p); if not c then continue end
        local char = p.Character
        if char and char:FindFirstChild("Head") and char:FindFirstChild("HumanoidRootPart") and char:FindFirstChild("Humanoid") then
            local head, root = char.Head, char.HumanoidRootPart
            local hPos, hOn = W2S(head.Position + Vector3.new(0, 1, 0))
            local rPos, rOn = W2S(root.Position - Vector3.new(0, 1, 0))
            
            if hOn and rOn then
                local h = math.abs(rPos.Y - hPos.Y); local w = h / 2
                local x = hPos.X - w / 2; local y = hPos.Y
                
                if Config.ESP or Config.BoxESP then
                    c.Fill.Visible = true; c.Fill.Size = Vector2.new(w, h); c.Fill.Position = Vector2.new(x, y)
                    c.Box.Visible = true; c.Box.Size = Vector2.new(w, h); c.Box.Position = Vector2.new(x, y)
                else
                    c.Fill.Visible = false; c.Box.Visible = false
                end
                
                if Config.NameTags then
                    c.Name.Visible = true; c.Name.Text = p.Name
                    c.Name.Position = Vector2.new(x + w / 2 - c.Name.TextBounds.X / 2, y - 16)
                else c.Name.Visible = false end
                
                if Config.HealthBars then
                    local hp = char.Humanoid.Health / math.max(char.Humanoid.MaxHealth, 1)
                    c.Health.Visible = true; c.Health.Size = Vector2.new(3, h * hp)
                    c.Health.Position = Vector2.new(x - 6, y + (h - h * hp))
                    c.Health.Color = Color3.fromHSV(hp * 0.3, 1, 1)
                else c.Health.Visible = false end
                
                if Config.Tracers then
                    c.Tracer.Visible = true; c.Tracer.From = Vector2.new(ScreenW / 2, ScreenH)
                    c.Tracer.To = Vector2.new(x + w / 2, y + h)
                else c.Tracer.Visible = false end
                
                if Config.HeadDot then
                    local dpos, dOn = W2S(head.Position)
                    if dOn then c.Dot.Visible = true; c.Dot.Position = dpos else c.Dot.Visible = false end
                else c.Dot.Visible = false end
                
                if Config.DistanceTags then
                    local dist = math.floor((root.Position - camPos).Magnitude)
                    c.Dist.Visible = true; c.Dist.Text = tostring(dist) .. "m"
                    c.Dist.Position = Vector2.new(x + w / 2 - c.Dist.TextBounds.X / 2, y + h + 2)
                else c.Dist.Visible = false end
            else
                for _, e in pairs(c) do if e then e.Visible = false end end
            end
        else
            for _, e in pairs(c) do if e then e.Visible = false end end
        end
    end
end

-- =========================================================
-- FEATURE LOGIC
-- =========================================================
local FeatureLogic = {}

FeatureLogic.Movement = function()
    if not State.Char or not State.Hum then return end
    
    -- Speed & WalkSpeed
    local baseSpeed = 16
    if Config.AutoSprint then baseSpeed = 32 end
    if Config.Speed then baseSpeed = 45 end
    if Config.GodSpeed then baseSpeed = 100 end
    State.Hum.WalkSpeed = baseSpeed
    
    -- JumpPower
    State.Hum.JumpPower = Config.JumpPower and 100 or 50
    
    -- Infinite Jump (Velocity based)
    if (Config.InfiniteJump or Config.NoJumpCooldown) and State.Hum.FloorMaterial == Enum.Material.Air then
        local now = tick()
        if now - State.LastJump > 0.2 then
            local v = State.Root.Velocity
            State.Root.Velocity = Vector3.new(v.X, 50, v.Z)
            State.LastJump = now
        end
    end
    
    -- Fly
    if Config.Fly then
        if not State.FlyBV then
            State.FlyBV = Instance.new("BodyVelocity", State.Root)
            State.FlyBV.MaxForce = Vector3.new(1e5, 1e5, 1e5)
        end
        local cam = Workspace.CurrentCamera
        local move = Vector3.new(0, 0, 0)
        if UserInputService:IsKeyDown(Enum.KeyCode.W) then move += cam.CFrame.LookVector end
        if UserInputService:IsKeyDown(Enum.KeyCode.S) then move -= cam.CFrame.LookVector end
        if UserInputService:IsKeyDown(Enum.KeyCode.A) then move -= cam.CFrame.RightVector end
        if UserInputService:IsKeyDown(Enum.KeyCode.D) then move += cam.CFrame.RightVector end
        if UserInputService:IsKeyDown(Enum.KeyCode.Space) then move += Vector3.new(0, 1, 0) end
        if UserInputService:IsKeyDown(Enum.KeyCode.LeftShift) then move -= Vector3.new(0, 1, 0) end
        State.FlyBV.Velocity = move * 45
        State.Root.CFrame = CFrame.new(State.Root.Position, State.Root.Position + cam.CFrame.LookVector)
    elseif State.FlyBV then
        State.FlyBV:Destroy(); State.FlyBV = nil
    end
    
    -- NoClip
    if (Config.NoClip or Config.NoclipAll) and State.Char then
        for _, v in pairs(State.Char:GetDescendants()) do
            if v:IsA("BasePart") and v.CanCollide then v.CanCollide = false end
        end
    end
    
    -- AntiVoid
    if Config.AntiVoid or Config.BypassVoid then
        if State.Root.Position.Y < -50 then
            State.Root.Velocity = Vector3.zero
            State.Root.CFrame = CFrame.new(0, 50, 0)
        end
    end
end

FeatureLogic.Combat = function()
    -- Killaura
    if Config.Killaura then
        local target, dist = GetNearestPlayer(20)
        if target and target.Character and target.Character:FindFirstChild("HumanoidRootPart") then
            SafeCall(function()
                State.Root.CFrame = target.Character.HumanoidRootPart.CFrame * CFrame.new(0, 0, 2)
            end)
        end
    end
    
    -- AutoClicker
    if Config.AutoClicker then
        SafeCall(function()
            local vim = game:GetService("VirtualInputManager")
            vim:SendMouseButtonEvent(ScreenW / 2, ScreenH / 2, 0, true, game, 0)
            vim:SendMouseButtonEvent(ScreenW / 2, ScreenH / 2, 0, false, game, 0)
        end)
    end
    
    -- HitBoxes
    for _, p in pairs(Players:GetPlayers()) do
        if p ~= LocalPlayer and p.Character and p.Character:FindFirstChild("HumanoidRootPart") then
            local hrp = p.Character.HumanoidRootPart
            if Config.HitBoxes or Config.Reach then
                SafeCall(function() hrp.Size = Vector3.new(12, 12, 12); hrp.Transparency = 0.5 end)
            else
                SafeCall(function() hrp.Size = Vector3.new(2, 2, 1); hrp.Transparency = 1 end)
            end
        end
    end
end

FeatureLogic.World = function()
    -- AntiAFK
    if Config.AntiAFK then
        -- Handled via LocalPlayer.Idled, but just in case
    end
    
    -- SpinBot
    if Config.SpinBot and State.Root then
        State.Root.CFrame = State.Root.CFrame * CFrame.Angles(0, math.rad(180), 0)
    end
    
    -- FPS Boost
    if Config.FPSBoost then
        Lighting.GlobalShadows = false
        Lighting.FogEnd = 1e10
    end
end

-- =========================================================
-- MAIN LOOP
-- =========================================================
RunService.RenderStepped:Connect(function()
    UpdateScreen()
    LayoutUI()
    UpdateESP()
    
    if State.Char and State.Hum then
        FeatureLogic.Movement()
    end
    
    FeatureLogic.Combat()
    FeatureLogic.World()
end)

LocalPlayer.Idled:Connect(function()
    if Config.AntiAFK then
        local vu = game:GetService("VirtualUser")
        vu:CaptureController()
        vu:ClickButton2(Vector2.new())
    end
end)

-- =========================================================
-- INIT
-- =========================================================
ProfileManager.ApplyPreset("Closet Cheat")
LayoutUI()
Disabler.Enable()
warn("[OVERKILL V4] Loaded successfully. Press RightShift or tap the top-left to toggle.")
